import json
import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_backend_env = os.path.join(_backend_dir, ".env")


class Settings(BaseSettings):
    """
    Application Settings loaded dynamically from .env file or environment variables.
    """

    PROJECT_NAME: str = "MahaTransit AI - Complaint Management System"
    API_V1_STR: str = "/api/v1"

    # PostgreSQL Database Connection URL (loaded from .env)
    DATABASE_URL: str = ""

    # Supabase Credentials (loaded from .env)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_BUCKET: str = "attachments"
    SUPABASE_ATTACHMENTS_BUCKET: str = "attachments"
    SUPABASE_VOICE_BUCKET: str = "voice-files"

    # AI / ML Settings
    WHISPER_MODEL_SIZE: str = "base"
    XGBOOST_MODEL_PATH: str = "./models/priority_xgb_model.joblib"
    HF_TOKEN: str = ""

    # CORS Origins allowed for Frontend (React + Vite)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8443",
        "http://127.0.0.1:8443",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:8443",
            "http://127.0.0.1:8443",
        ]

    @field_validator("DATABASE_URL", mode="after")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if v and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+psycopg2://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=(_backend_env, ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
