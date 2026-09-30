from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# -----------------------------------------------------------------------------
# 1. Speech-to-Text Schemas
# -----------------------------------------------------------------------------
class SpeechToTextRequest(BaseModel):
    complaint_id: Optional[UUID] = Field(
        None, description="UUID of existing complaint with an audio attachment"
    )
    audio_url: Optional[str] = Field(
        None, description="Direct URL or local file path to audio file if not referencing complaint_id"
    )
    language: Optional[str] = Field(
        None, description="Optional forced language code ('en', 'hi', 'mr'). Auto-detects if None."
    )
    model_size: Optional[str] = Field(
        None, description="Optional Whisper model size override ('tiny', 'base', 'small')"
    )


class SpeechToTextResponse(BaseModel):
    complaint_id: Optional[UUID] = None
    attachment_id: Optional[str] = None
    speech_text: str
    language: str
    status: str = "success"

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 2. Multilingual Translation Schemas
# -----------------------------------------------------------------------------
class TranslationRequest(BaseModel):
    complaint_id: Optional[UUID] = Field(
        None, description="UUID of complaint to translate in-place in database"
    )
    text: Optional[str] = Field(
        None, description="Direct text to translate if not referencing a complaint_id"
    )
    source_language: Optional[str] = Field(
        None, description="Source language code ('hi', 'mr', 'gu', 'ur', 'bn', 'pa', 'ml', 'en'). Auto-detects if None."
    )


class TranslationResponse(BaseModel):
    complaint_id: Optional[UUID] = None
    original_text: str
    translated_text: str
    source_language: str
    target_language: str = "en"
    status: str = "success"

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 3. Duplicate Detection Schemas
# -----------------------------------------------------------------------------
class DuplicateMatchItem(BaseModel):
    matched_complaint_id: UUID
    matched_ticket_number: Optional[str] = None
    matched_title: Optional[str] = None
    similarity_score: float
    is_duplicate: bool

    model_config = ConfigDict(from_attributes=True)


class DuplicateDetectionRequest(BaseModel):
    complaint_id: Optional[UUID] = Field(
        None, description="UUID of complaint to search against database"
    )
    text: Optional[str] = Field(
        None, description="Raw text string to test embedding/duplicate match against candidates"
    )
    similarity_threshold: float = Field(
        0.75, ge=0.0, le=1.0, description="Minimum cosine similarity cutoff to qualify as duplicate"
    )
    limit: int = Field(5, ge=1, le=50, description="Maximum number of duplicate matches to return")


class DuplicateDetectionResponse(BaseModel):
    complaint_id: Optional[UUID] = None
    has_duplicates: bool
    duplicate_count: int
    duplicates: List[DuplicateMatchItem]
    status: str = "success"

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 4. Priority Prediction Schemas
# -----------------------------------------------------------------------------
class PriorityPredictionRequest(BaseModel):
    complaint_id: Optional[UUID] = Field(
        None, description="UUID of complaint to classify and update in database"
    )
    text: Optional[str] = Field(
        None, description="Raw complaint description to classify directly"
    )
    transit_mode: Optional[str] = Field(
        "bus", description="Transit mode ('metro', 'bus', 'train')"
    )


class PriorityPredictionResponse(BaseModel):
    complaint_id: Optional[UUID] = None
    transit_mode: Optional[str] = None
    predicted_priority: Optional[str] = None  # low, medium, high, critical
    priority_confidence: Optional[float] = None
    status: str = "success"

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# 5. Full End-to-End Pipeline Schemas
# -----------------------------------------------------------------------------
class FullPipelineRequest(BaseModel):
    complaint_id: UUID = Field(..., description="UUID of newly submitted complaint to process through all 4 AI stages")


class FullPipelineResponse(BaseModel):
    complaint_id: UUID
    speech_text: Optional[str] = None
    detected_language: Optional[str] = None
    translated_text: Optional[str] = None
    is_duplicate: bool = False
    duplicate_count: int = 0
    duplicates: List[DuplicateMatchItem] = []
    predicted_priority: Optional[str] = None
    priority_confidence: Optional[float] = None
    status: str = "success"

    model_config = ConfigDict(from_attributes=True)

