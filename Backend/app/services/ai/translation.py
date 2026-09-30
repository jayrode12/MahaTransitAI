import logging
from typing import Optional, Dict, Any, Tuple
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.complaint import Complaint, AIResult

logger = logging.getLogger(__name__)

# Map supported source language codes to their dedicated Hugging Face MarianMT models
MODEL_NAMES: Dict[str, str] = {
    "hi": "Helsinki-NLP/opus-mt-hi-en",   # Hindi -> English (~300MB)
    "mr": "Helsinki-NLP/opus-mt-mr-en",   # Marathi -> English (~300MB)
    "gu": "Helsinki-NLP/opus-mt-inc-en",  # Gujarati (Indic) -> English (~300MB)
    "ur": "Helsinki-NLP/opus-mt-ur-en",   # Urdu -> English (~300MB)
    "bn": "Helsinki-NLP/opus-mt-bn-en",   # Bengali -> English (~300MB)
    "pa": "Helsinki-NLP/opus-mt-pa-en",   # Punjabi -> English (~300MB)
    "ml": "Helsinki-NLP/opus-mt-ml-en",   # Malayalam -> English (~300MB)
}

# Module-level cache to keep loaded models in memory (avoids reloading on every call)
_translation_cache: Dict[str, Tuple[Any, Any]] = {}
_transformers_failed = False


def detect_script_language(text: str) -> str:
    """
    Infers the language code from Unicode character ranges if no language is specified.
    """
    if not text:
        return "en"

    for char in text:
        cp = ord(char)
        if 0x0600 <= cp <= 0x06FF or 0x0750 <= cp <= 0x077F:
            return "ur"
        if 0x0A80 <= cp <= 0x0AFF:
            return "gu"
        if 0x0980 <= cp <= 0x09FF:
            return "bn"
        if 0x0A00 <= cp <= 0x0A7F:
            return "pa"
        if 0x0D00 <= cp <= 0x0D7F:
            return "ml"
        if 0x0900 <= cp <= 0x097F:
            return "hi"

    return "en"


def get_translation_model(source_language: str) -> Optional[Tuple[Any, Any]]:
    """
    Lazily loads and caches the MarianMT model and tokenizer for the requested language.
    Falls back gracefully if transformers/torch is unavailable.
    """
    global _translation_cache, _transformers_failed
    lang_code = source_language.lower().strip()
    if lang_code not in MODEL_NAMES or _transformers_failed:
        return None

    if lang_code not in _translation_cache:
        try:
            from transformers import MarianMTModel, MarianTokenizer
            model_name = MODEL_NAMES[lang_code]
            logger.info("Loading translation model '%s' into memory...", model_name)
            tokenizer = MarianTokenizer.from_pretrained(model_name)
            model = MarianMTModel.from_pretrained(model_name)
            _translation_cache[lang_code] = (model, tokenizer)
        except Exception as e:
            logger.warning("Could not load MarianMT model for '%s' (%s).", lang_code, e)
            _transformers_failed = True
            return None

    return _translation_cache.get(lang_code)


def translate_text(text: str, source_language: Optional[str] = None) -> str:
    """
    Translates text into English with automatic script detection and graceful fallback.
    """
    if not text or not text.strip():
        return ""

    if source_language:
        lang_code = source_language.lower().strip()
    else:
        lang_code = detect_script_language(text)

    if lang_code == "en":
        return text.strip()

    model_pair = get_translation_model(lang_code)
    if model_pair is not None:
        try:
            model, tokenizer = model_pair
            inputs = tokenizer(
                text,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512,
            )
            translated_tokens = model.generate(
                **inputs,
                max_length=512,
                num_beams=4,
                early_stopping=True,
            )
            translated_text = tokenizer.decode(translated_tokens[0], skip_special_tokens=True)
            return translated_text.strip()
        except Exception as e:
            logger.warning("Translation generation error: %s. Returning original text.", e)

    return text.strip()


def process_complaint_translation(
    complaint_id: UUID,
    db: Session,
) -> Dict[str, Any]:
    """
    Loads complaint from the database, translates description_original (or speech_text)
    into English, updates both complaints.description_english and ai_results.translated_text.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise ValueError(f"Complaint with ID '{complaint_id}' not found.")

    ai_result = db.query(AIResult).filter(AIResult.complaint_id == complaint_id).first()

    text_to_translate = complaint.description_original
    if (not text_to_translate or text_to_translate.strip() == "") and ai_result and ai_result.speech_text:
        text_to_translate = ai_result.speech_text

    source_lang = (complaint.language or "").lower().strip()
    if not source_lang or source_lang == "en":
        detected_lang = detect_script_language(text_to_translate)
        source_lang = detected_lang if detected_lang != "en" else "en"

    if source_lang == "en":
        translated_text = text_to_translate
    else:
        translated_text = translate_text(text_to_translate, source_language=source_lang)

    complaint.description_english = translated_text

    if ai_result:
        ai_result.translated_text = translated_text
    else:
        ai_result = AIResult(
            complaint_id=complaint_id,
            translated_text=translated_text,
        )
        db.add(ai_result)

    db.commit()
    db.refresh(complaint)
    db.refresh(ai_result)

    return {
        "complaint_id": str(complaint_id),
        "source_language": source_lang,
        "original_text": text_to_translate,
        "translated_text": translated_text,
    }
