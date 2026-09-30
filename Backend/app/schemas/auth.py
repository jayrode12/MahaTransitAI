from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., description="Email address or username handle (e.g., metro, best, locals, admin)")
    password: str = Field(..., min_length=1)
    user_type: Optional[str] = Field("citizen", pattern="^(citizen|admin)$")


class AuthResponse(BaseModel):
    user_id: UUID
    user_type: str
    role: str
    full_name: str
    email: str
    preferred_language: Optional[str] = "en"
    department_id: Optional[UUID] = None
    department_name: Optional[str] = None
    transit_mode: Optional[str] = None  # 'metro', 'bus', 'train', or 'all'
    access_token: Optional[str] = None
    message: str = "Authentication successful"


class MessageResponse(BaseModel):
    message: str
