import logging
import os
import re
from typing import Optional, Dict, Any, Tuple
from uuid import UUID

import numpy as np
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.complaint import Complaint, AIResult
from app.services.ai.duplicate_detection import generate_embedding

logger = logging.getLogger(__name__)

# Module-level model artifact cache
_priority_artifact: Optional[Dict[str, Any]] = None
_model_load_failed = False


def _heuristic_priority(text: str, transit_mode: str) -> Tuple[str, float]:
    """
    Intelligent keyword-based priority inference fallback.
    """
    t = (text or "").lower()

    critical_keywords = [
        "fire", "smoke", "accident", "emergency", "blood", "harassment",
        "assault", "violence", "threat", "explosion", "life", "urgent",
        "derail", "derailment", "collapse", "electrocution",
    ]
    high_keywords = [
        "broken door", "brake", "signal failure", "stuck in tunnel",
        "stalled", "track", "delay", "waterlogging", "flood",
        "overcrowd", "overcrowded", "stampede", "pickpocket", "theft",
        "injured", "injury", "medical",
    ]
    medium_keywords = [
        "ac", "air condition", "cooling", "dirty", "cleanliness",
        "smell", "odor", "fan", "light", "display", "announcement",
        "ticket", "machine", "vending", "recharge", "fare", "queue",
    ]

    for kw in critical_keywords:
        if kw in t:
            return "critical", 0.94

    for kw in high_keywords:
        if kw in t:
            return "high", 0.88

    for kw in medium_keywords:
        if kw in t:
            return "medium", 0.82

    return "low", 0.75


def get_priority_model() -> Optional[Dict[str, Any]]:
    """
    Loads and caches the trained XGBoost priority classification artifact from disk.
    Falls back gracefully if model loading fails.
    """
    global _priority_artifact, _model_load_failed
    if _priority_artifact is None and not _model_load_failed:
        model_path = getattr(settings, "XGBOOST_MODEL_PATH", "./models/priority_xgb_model.joblib")
        if not os.path.isabs(model_path) and not os.path.exists(model_path):
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            alt_path = os.path.join(base_dir, "models", "priority_xgb_model.joblib")
            if os.path.exists(alt_path):
                model_path = alt_path

        if os.path.exists(model_path):
            try:
                import joblib
                logger.info("Loading priority prediction model from: %s", model_path)
                _priority_artifact = joblib.load(model_path)
            except Exception as e:
                logger.warning("Could not load joblib model (%s). Using heuristic fallback.", e)
                _model_load_failed = True
        else:
            logger.info("XGBoost model file not found at %s. Using heuristic priority engine.", model_path)
            _model_load_failed = True

    return _priority_artifact


def predict_priority(text: str, transit_mode: str = "bus") -> Tuple[str, float]:
    """
    Predicts the priority level for a transit complaint using XGBoost with heuristic fallback.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        return "medium", 0.5

    artifact = get_priority_model()
    if artifact is not None:
        try:
            model = artifact["model"]
            int_to_class = artifact["int_to_class"]

            text_embedding = generate_embedding(clean_text)

            m = (transit_mode or "bus").lower().strip()
            mode_one_hot = [
                1.0 if m == "metro" else 0.0,
                1.0 if m == "bus" else 0.0,
                1.0 if m == "train" else 0.0,
            ]

            features = np.array(text_embedding + mode_one_hot, dtype=np.float32).reshape(1, -1)
            probabilities = model.predict_proba(features)[0]
            best_class_idx = int(np.argmax(probabilities))
            confidence = float(probabilities[best_class_idx])
            predicted_label = int_to_class[best_class_idx]
            return str(predicted_label).lower(), round(confidence, 4)
        except Exception as e:
            logger.warning("XGBoost prediction error (%s). Falling back to heuristic.", e)

    return _heuristic_priority(clean_text, transit_mode)


def process_complaint_priority(
    complaint_id: UUID,
    db: Session,
) -> Dict[str, Any]:
    """
    Predicts the priority of a complaint, writes to ai_results (predicted_priority, priority_confidence),
    and updates the complaint's active priority column in the complaints table.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise ValueError(f"Complaint with ID '{complaint_id}' not found.")

    text_to_classify = complaint.description_english or complaint.description_original
    if not text_to_classify:
        ai_res = db.query(AIResult).filter(AIResult.complaint_id == complaint_id).first()
        if ai_res and (ai_res.translated_text or ai_res.speech_text):
            text_to_classify = ai_res.translated_text or ai_res.speech_text
    text_to_classify = text_to_classify or ""
    transit_mode = complaint.transit_mode or "bus"

    predicted_priority, confidence = predict_priority(
        text=text_to_classify,
        transit_mode=transit_mode,
    )

    complaint.priority = predicted_priority

    ai_result = db.query(AIResult).filter(AIResult.complaint_id == complaint_id).first()
    if ai_result:
        ai_result.predicted_priority = predicted_priority
        ai_result.priority_confidence = confidence
    else:
        ai_result = AIResult(
            complaint_id=complaint_id,
            predicted_priority=predicted_priority,
            priority_confidence=confidence,
        )
        db.add(ai_result)

    db.commit()
    db.refresh(complaint)
    db.refresh(ai_result)

    return {
        "complaint_id": str(complaint_id),
        "transit_mode": transit_mode,
        "predicted_priority": predicted_priority,
        "priority_confidence": confidence,
    }
