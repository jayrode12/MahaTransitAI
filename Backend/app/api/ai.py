import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_optional_db
from app.models.complaint import Complaint
from app.schemas.ai import (
    SpeechToTextRequest,
    SpeechToTextResponse,
    TranslationRequest,
    TranslationResponse,
    DuplicateMatchItem,
    DuplicateDetectionRequest,
    DuplicateDetectionResponse,
    PriorityPredictionRequest,
    PriorityPredictionResponse,
    FullPipelineRequest,
    FullPipelineResponse,
)
from app.services.ai.speech_to_text import (
    process_complaint_audio,
    transcribe_audio_bytes,
)
from app.services.ai.translation import (
    process_complaint_translation,
    translate_text,
    detect_script_language,
)
from app.services.ai.duplicate_detection import (
    detect_duplicates_for_complaint,
    generate_embedding,
)
from app.services.ai.priority_prediction import (
    process_complaint_priority,
    predict_priority,
)
from app.services.ai.pipeline import run_full_complaint_ai_pipeline
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI"])


# -----------------------------------------------------------------------------
# 1. Speech-to-Text Endpoint
# -----------------------------------------------------------------------------
@router.post(
    "/speech-to-text",
    response_model=SpeechToTextResponse,
    summary="Transcribe audio attachment from complaint or direct audio URL",
)
def speech_to_text(
    payload: SpeechToTextRequest,
    db: Session = Depends(get_optional_db),
):
    """
    Transcribes audio using local Whisper:
    - If `complaint_id` is supplied: retrieves audio from complaint_attachments, transcribes it,
      and writes to `ai_results.speech_text`.
    - If `audio_url` is supplied: fetches the audio file and returns the transcript directly.
    """
    if payload.complaint_id:
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not configured. Set DATABASE_URL in .env to process complaints by ID.",
            )
        result = process_complaint_audio(
            complaint_id=payload.complaint_id,
            db=db,
            model_size=payload.model_size,
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No audio attachment found for complaint '{payload.complaint_id}'.",
            )
        return SpeechToTextResponse(
            complaint_id=payload.complaint_id,
            attachment_id=result.get("attachment_id"),
            speech_text=result["speech_text"],
            language=result["language"],
            status="success",
        )

    if payload.audio_url:
        try:
            audio_bytes = StorageService.download_file_bytes(payload.audio_url)
            transcription = transcribe_audio_bytes(
                audio_bytes=audio_bytes,
                original_filename=payload.audio_url,
                language=payload.language,
                model_size=payload.model_size,
            )
            return SpeechToTextResponse(
                speech_text=transcription["text"],
                language=transcription["language"],
                status="success",
            )
        except Exception as e:
            logger.error("Error downloading or transcribing audio: %s", str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Audio transcription failed: {str(e)}",
            )

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Must provide either 'complaint_id' or 'audio_url'.",
    )


# -----------------------------------------------------------------------------
# 2. Multilingual Translation Endpoint
# -----------------------------------------------------------------------------
@router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="Translate non-English complaint into English using MarianMT",
)
def translate(
    payload: TranslationRequest,
    db: Session = Depends(get_optional_db),
):
    """
    Translates text into English:
    - If `complaint_id` is supplied: translates description_original, updates complaints.description_english
      and ai_results.translated_text in DB.
    - If `text` is supplied: translates input text directly.
    """
    if payload.complaint_id:
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not configured. Set DATABASE_URL in .env to process complaints by ID.",
            )
        try:
            result = process_complaint_translation(
                complaint_id=payload.complaint_id,
                db=db,
            )
            return TranslationResponse(
                complaint_id=payload.complaint_id,
                original_text=result["original_text"],
                translated_text=result["translated_text"],
                source_language=result["source_language"],
                target_language="en",
                status="success",
            )
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

    if payload.text is not None:
        try:
            source_lang = payload.source_language or detect_script_language(payload.text)
            translated = translate_text(payload.text, source_language=source_lang)
            return TranslationResponse(
                original_text=payload.text,
                translated_text=translated,
                source_language=source_lang,
                target_language="en",
                status="success",
            )
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Must provide either 'complaint_id' or 'text'.",
    )


# -----------------------------------------------------------------------------
# 3. Duplicate Detection Endpoint
# -----------------------------------------------------------------------------
@router.post(
    "/detect-duplicate",
    response_model=DuplicateDetectionResponse,
    summary="Detect duplicate complaints using Sentence Transformers & pgvector HNSW index",
)
def detect_duplicate(
    payload: DuplicateDetectionRequest,
    db: Session = Depends(get_optional_db),
):
    """
    Performs pairwise duplicate detection:
    - If `complaint_id` is supplied: encodes complaint, performs cosine similarity search,
      and saves pairwise matches into the `duplicate_complaints` table.
    - If `text` is supplied: encodes text and searches for existing nearest complaints in the DB.
    """
    if payload.complaint_id:
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not configured. Set DATABASE_URL in .env to process complaints by ID.",
            )
        try:
            duplicates = detect_duplicates_for_complaint(
                complaint_id=payload.complaint_id,
                db=db,
                similarity_threshold=payload.similarity_threshold,
                limit=payload.limit,
            )
            match_items = [
                DuplicateMatchItem(
                    matched_complaint_id=UUID(d["matched_complaint_id"]),
                    matched_ticket_number=d.get("matched_ticket_number"),
                    matched_title=d.get("matched_title"),
                    similarity_score=d["similarity_score"],
                    is_duplicate=d["is_duplicate"],
                )
                for d in duplicates
            ]
            return DuplicateDetectionResponse(
                complaint_id=payload.complaint_id,
                has_duplicates=len(match_items) > 0,
                duplicate_count=len(match_items),
                duplicates=match_items,
                status="success",
            )
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

    if payload.text:
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not configured. Set DATABASE_URL in .env to query nearest complaints.",
            )
        # Search DB for complaints matching raw text
        query_vec = generate_embedding(payload.text)
        max_dist = 1.0 - payload.similarity_threshold
        dist_expr = Complaint.embedding.cosine_distance(query_vec)

        rows = (
            db.query(Complaint, dist_expr.label("distance"))
            .filter(Complaint.embedding.isnot(None), dist_expr <= max_dist)
            .order_by(dist_expr.asc())
            .limit(payload.limit)
            .all()
        )

        match_items = []
        for comp, dist in rows:
            sim = round(max(0.0, min(1.0, 1.0 - float(dist))), 4)
            match_items.append(
                DuplicateMatchItem(
                    matched_complaint_id=comp.id,
                    matched_ticket_number=comp.ticket_number,
                    matched_title=comp.title,
                    similarity_score=sim,
                    is_duplicate=True,
                )
            )

        return DuplicateDetectionResponse(
            has_duplicates=len(match_items) > 0,
            duplicate_count=len(match_items),
            duplicates=match_items,
            status="success",
        )

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Must provide either 'complaint_id' or 'text'.",
    )


# -----------------------------------------------------------------------------
# 4. Priority Prediction Endpoint
# -----------------------------------------------------------------------------
@router.post(
    "/predict-priority",
    response_model=PriorityPredictionResponse,
    summary="Predict complaint priority (low/medium/high/critical) using XGBoost",
)
def predict_priority_endpoint(
    payload: PriorityPredictionRequest,
    db: Session = Depends(get_optional_db),
):
    """
    Predicts priority level:
    - If `complaint_id` is supplied: predicts priority, updates complaints.priority,
      and writes to `ai_results.predicted_priority` & `priority_confidence` in DB.
    - If `text` is supplied: predicts priority and confidence score directly.
    """
    if payload.complaint_id:
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database is not configured. Set DATABASE_URL in .env to process complaints by ID.",
            )
        try:
            result = process_complaint_priority(
                complaint_id=payload.complaint_id,
                db=db,
            )
            return PriorityPredictionResponse(
                complaint_id=payload.complaint_id,
                transit_mode=result["transit_mode"],
                predicted_priority=result["predicted_priority"],
                priority_confidence=result["priority_confidence"],
                status="success",
            )
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))

    if payload.text is not None:
        try:
            predicted_prio, confidence = predict_priority(
                text=payload.text,
                transit_mode=payload.transit_mode or "bus",
            )
            return PriorityPredictionResponse(
                transit_mode=payload.transit_mode or "bus",
                predicted_priority=predicted_prio,
                priority_confidence=confidence,
                status="success",
            )
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Must provide either 'complaint_id' or 'text'.",
    )


# -----------------------------------------------------------------------------
# 5. Full End-to-End AI Pipeline Endpoint
# -----------------------------------------------------------------------------
@router.post(
    "/pipeline",
    response_model=FullPipelineResponse,
    summary="Execute full AI pipeline (STT -> Translation -> Duplicates -> Priority) on a complaint",
)
def execute_pipeline(
    payload: FullPipelineRequest,
    db: Session = Depends(get_optional_db),
):
    """
    Executes all 4 AI stages in sequence for a complaint and commits outcomes to the database.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not configured. Set DATABASE_URL in .env to run pipeline on complaints.",
        )
    try:
        result = run_full_complaint_ai_pipeline(
            complaint_id=payload.complaint_id,
            db=db,
        )
        match_items = [
            DuplicateMatchItem(
                matched_complaint_id=UUID(d["matched_complaint_id"]),
                matched_ticket_number=d.get("matched_ticket_number"),
                matched_title=d.get("matched_title"),
                similarity_score=d["similarity_score"],
                is_duplicate=d["is_duplicate"],
            )
            for d in result.get("duplicates", [])
        ]
        return FullPipelineResponse(
            complaint_id=payload.complaint_id,
            speech_text=result.get("speech_text"),
            detected_language=result.get("detected_language"),
            translated_text=result.get("translated_text"),
            is_duplicate=result.get("is_duplicate", False),
            duplicate_count=result.get("duplicate_count", 0),
            duplicates=match_items,
            predicted_priority=result.get("predicted_priority"),
            priority_confidence=result.get("priority_confidence"),
            status="success",
        )
    except Exception as e:
        logger.error("Error running AI pipeline for complaint %s: %s", payload.complaint_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI pipeline processing error: {str(e)}",
        )
