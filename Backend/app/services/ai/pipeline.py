import logging
from typing import Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.complaint import Complaint, AIResult, DuplicateComplaint
from app.services.ai.speech_to_text import process_complaint_audio
from app.services.ai.translation import process_complaint_translation
from app.services.ai.duplicate_detection import detect_duplicates_for_complaint
from app.services.ai.priority_prediction import process_complaint_priority

logger = logging.getLogger(__name__)


def run_full_complaint_ai_pipeline(
    complaint_id: UUID,
    db: Session,
) -> Dict[str, Any]:
    """
    Orchestrates the entire MahaTransit AI workflow for a complaint:
    1. Speech-to-Text: If voice attachment exists, transcribes to ai_results.speech_text.
    2. Multilingual Translation: Translates non-English complaints to complaints.description_english & ai_results.translated_text.
    3. Duplicate Detection: Generates 384-dim embedding, searches existing complaints via HNSW index, records matches in duplicate_complaints.
    4. Priority Prediction: XGBoost classifies urgency, updates complaints.priority and ai_results.predicted_priority/confidence.

    Args:
        complaint_id: UUID of the complaint.
        db: Active SQLAlchemy database session.

    Returns:
        Structured dictionary summarizing outcomes from all 4 stages.
    """
    logger.info("Starting Full AI Pipeline for complaint: %s", complaint_id)

    # 1. Step 1: Speech-to-Text (if voice attachment is present)
    stt_result = process_complaint_audio(complaint_id=complaint_id, db=db)
    speech_text = stt_result.get("speech_text") if stt_result else None
    detected_lang = stt_result.get("language") if stt_result else None

    # 2. Step 2: Multilingual Translation
    trans_result = process_complaint_translation(complaint_id=complaint_id, db=db)
    translated_text = trans_result.get("translated_text")

    # 3. Step 3: Duplicate Detection via Embeddings + pgvector
    duplicates = detect_duplicates_for_complaint(complaint_id=complaint_id, db=db)
    is_duplicate = len(duplicates) > 0

    # 4. Step 4: Priority Prediction via XGBoost
    priority_result = process_complaint_priority(complaint_id=complaint_id, db=db)

    logger.info(
        "Full AI Pipeline completed for %s: Priority=%s, Duplicates=%d",
        complaint_id,
        priority_result.get("predicted_priority"),
        len(duplicates),
    )

    return {
        "complaint_id": str(complaint_id),
        "speech_text": speech_text,
        "detected_language": detected_lang,
        "translated_text": translated_text,
        "is_duplicate": is_duplicate,
        "duplicate_count": len(duplicates),
        "duplicates": duplicates,
        "predicted_priority": priority_result.get("predicted_priority"),
        "priority_confidence": priority_result.get("priority_confidence"),
        "status": "success",
    }
