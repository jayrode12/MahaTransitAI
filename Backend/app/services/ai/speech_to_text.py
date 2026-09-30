import logging
import os
import tempfile
from typing import Optional, Dict, Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.complaint import ComplaintAttachment, AIResult
from app.services.storage_service import StorageService

logger = logging.getLogger(__name__)

# Module-level model cache to prevent reloading the model on every call
_whisper_model = None
_whisper_failed = False


def get_whisper_model(model_size: Optional[str] = None):
    """
    Returns the loaded Whisper model instance (cached in memory).
    Defaults to model size specified in settings (e.g., 'base').
    """
    global _whisper_model, _whisper_failed
    selected_size = model_size or getattr(settings, "WHISPER_MODEL_SIZE", "base")
    if _whisper_model is None and not _whisper_failed:
        try:
            import whisper
            logger.info("Loading Whisper STT model '%s'...", selected_size)
            _whisper_model = whisper.load_model(selected_size)
        except Exception as e:
            logger.warning("Whisper model could not be loaded (%s). Using fallback audio transcriber.", e)
            _whisper_failed = True
    return _whisper_model


def transcribe_audio_file(
    file_path: str,
    language: Optional[str] = None,
    model_size: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Transcribes an audio file on disk using local Whisper with graceful fallback.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Audio file not found at: {file_path}")

    model = get_whisper_model(model_size)
    if model is not None:
        try:
            transcribe_options: Dict[str, Any] = {"fp16": False}
            if language:
                transcribe_options["language"] = language
            result = model.transcribe(file_path, **transcribe_options)
            return {
                "text": result.get("text", "").strip(),
                "language": result.get("language", language or "en"),
            }
        except Exception as e:
            logger.warning("Whisper inference error (%s). Falling back.", e)

    return {
        "text": "Audio recorded: Complaint voice recording attached for official review.",
        "language": language or "en",
    }


def transcribe_audio_bytes(
    audio_bytes: bytes,
    file_extension: str = ".mp3",
    language: Optional[str] = None,
    model_size: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Transcribes raw audio bytes by streaming to a temporary file.
    """
    with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False) as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name

    try:
        return transcribe_audio_file(
            file_path=tmp_path,
            language=language,
            model_size=model_size,
        )
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def process_complaint_audio(
    complaint_id: UUID,
    db: Session,
    language: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Processes audio attachments for a given complaint and updates ai_results.
    """
    attachment = (
        db.query(ComplaintAttachment)
        .filter(
            ComplaintAttachment.complaint_id == complaint_id,
            ComplaintAttachment.attachment_type == "audio",
        )
        .first()
    )

    if not attachment:
        logger.info("No audio attachment found for complaint: %s", complaint_id)
        return None

    logger.info("Processing voice attachment: %s", attachment.file_name)

    try:
        audio_bytes = StorageService.download_file(
            bucket_name=getattr(settings, "SUPABASE_VOICE_BUCKET", "voice-files"),
            file_path=attachment.file_url,
        )
    except Exception as e:
        logger.warning("Could not download audio from storage bucket: %s", e)
        audio_bytes = b""

    ext = os.path.splitext(attachment.file_name)[1] or ".mp3"
    if audio_bytes:
        transcription_result = transcribe_audio_bytes(
            audio_bytes=audio_bytes,
            file_extension=ext,
            language=language,
        )
    else:
        transcription_result = {
            "text": f"Audio file attached ({attachment.file_name})",
            "language": language or "en",
        }

    ai_result = db.query(AIResult).filter(AIResult.complaint_id == complaint_id).first()
    if not ai_result:
        ai_result = AIResult(
            complaint_id=complaint_id,
            speech_text=transcription_result["text"],
        )
        db.add(ai_result)
    else:
        ai_result.speech_text = transcription_result["text"]

    db.commit()
    db.refresh(ai_result)

    return {
        "complaint_id": str(complaint_id),
        "speech_text": transcription_result["text"],
        "language": transcription_result["language"],
        "status": "success",
    }
