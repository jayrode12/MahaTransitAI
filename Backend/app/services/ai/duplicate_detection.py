import hashlib
import logging
import math
import re
from typing import Optional, List, Dict, Any
from uuid import UUID

import numpy as np
from sqlalchemy.orm import Session

from app.models.complaint import Complaint, DuplicateComplaint, AIResult

logger = logging.getLogger(__name__)

# Model constant: 384-dimensional dense semantic vector space
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

# Module-level model cache to avoid reloading weights into memory
_embedding_model = None
_model_failed = False


def _hash_embedding(text: str, dim: int = EMBEDDING_DIM) -> List[float]:
    """
    High-quality deterministic fallback embedding generator when SentenceTransformers
    or heavy PyTorch wheels are unavailable. Produces normalized 384-dim vectors.
    """
    tokens = re.findall(r"\w+", text.lower())
    vec = np.zeros(dim, dtype=np.float32)

    for i, token in enumerate(tokens):
        # 3 hashes per word for dense coverage
        h1 = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16) % dim
        h2 = int(hashlib.sha256(token.encode("utf-8")).hexdigest(), 16) % dim
        h3 = int(hashlib.sha1((token + str(i % 5)).encode("utf-8")).hexdigest(), 16) % dim
        vec[h1] += 1.0
        vec[h2] += 0.5
        vec[h3] += 0.25

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    else:
        # Uniform unit vector if empty
        vec = np.ones(dim, dtype=np.float32) / math.sqrt(dim)
    return vec.tolist()


def get_embedding_model():
    """
    Returns the loaded SentenceTransformer model instance (cached in memory).
    Falls back gracefully if torch or sentence-transformers is missing.
    """
    global _embedding_model, _model_failed
    if _embedding_model is None and not _model_failed:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading embedding model '%s' into memory...", EMBEDDING_MODEL_NAME)
            _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        except Exception as e:
            logger.warning("SentenceTransformer model could not be loaded (%s). Using semantic hash fallback.", e)
            _model_failed = True
    return _embedding_model


def generate_embedding(text: str) -> List[float]:
    """
    Encodes an input string into a 384-dimensional normalized vector.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        return [0.0] * EMBEDDING_DIM

    model = get_embedding_model()
    if model is not None:
        try:
            vector = model.encode(clean_text, normalize_embeddings=True)
            return vector.tolist()
        except Exception as e:
            logger.warning("Inference error in SentenceTransformer (%s). Falling back.", e)

    return _hash_embedding(clean_text, EMBEDDING_DIM)


def calculate_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    In-memory cosine similarity calculation between two float vectors.
    """
    a = np.array(vec1, dtype=np.float32)
    b = np.array(vec2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def find_similar_texts_in_memory(
    query_text: str,
    candidates: List[Dict[str, Any]],
    threshold: float = 0.75,
) -> List[Dict[str, Any]]:
    """
    Finds semantically similar texts from an in-memory list of candidate dicts.
    """
    query_vec = generate_embedding(query_text)
    matches = []

    for item in candidates:
        cand_text = item.get("text", "")
        cand_vec = generate_embedding(cand_text)
        similarity = calculate_cosine_similarity(query_vec, cand_vec)
        if similarity >= threshold:
            matches.append({
                "candidate_id": item.get("id"),
                "text": cand_text,
                "similarity_score": round(similarity, 4),
                "is_duplicate": True,
            })

    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches


def detect_duplicates_for_complaint(
    complaint_id: UUID,
    db: Session,
    similarity_threshold: float = 0.75,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Performs pairwise duplicate detection for a complaint using pgvector search.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise ValueError(f"Complaint with ID '{complaint_id}' not found.")

    text_to_embed = complaint.description_english or complaint.description_original
    if not text_to_embed:
        ai_res = db.query(AIResult).filter(AIResult.complaint_id == complaint_id).first()
        if ai_res and (ai_res.translated_text or ai_res.speech_text):
            text_to_embed = ai_res.translated_text or ai_res.speech_text
    text_to_embed = text_to_embed or ""

    if complaint.embedding is None:
        embedding_vec = generate_embedding(text_to_embed)
        complaint.embedding = embedding_vec
        db.commit()
        db.refresh(complaint)
    else:
        embedding_vec = list(complaint.embedding)

    max_distance = 1.0 - similarity_threshold
    recorded_duplicates = []

    try:
        distance_expr = Complaint.embedding.cosine_distance(embedding_vec)
        query = (
            db.query(Complaint, distance_expr.label("distance"))
            .filter(
                Complaint.id != complaint_id,
                Complaint.embedding.isnot(None),
                distance_expr <= max_distance,
            )
            .order_by(distance_expr.asc())
            .limit(limit)
        )
        results = query.all()

        for matched_complaint, distance in results:
            similarity_score = round(max(0.0, min(1.0, 1.0 - float(distance))), 4)
            is_dup = similarity_score >= similarity_threshold

            existing_dup = (
                db.query(DuplicateComplaint)
                .filter(
                    DuplicateComplaint.complaint_id == complaint_id,
                    DuplicateComplaint.matched_complaint_id == matched_complaint.id,
                )
                .first()
            )

            if existing_dup:
                existing_dup.similarity_score = similarity_score
                existing_dup.is_duplicate = is_dup
            else:
                new_dup = DuplicateComplaint(
                    complaint_id=complaint_id,
                    matched_complaint_id=matched_complaint.id,
                    similarity_score=similarity_score,
                    is_duplicate=is_dup,
                )
                db.add(new_dup)

            recorded_duplicates.append({
                "matched_complaint_id": str(matched_complaint.id),
                "matched_ticket_number": matched_complaint.ticket_number,
                "matched_title": matched_complaint.title,
                "similarity_score": similarity_score,
                "is_duplicate": is_dup,
            })

        db.commit()
    except Exception as e:
        logger.warning("pgvector cosine distance query skipped or failed: %s", e)
        db.rollback()

    return recorded_duplicates
