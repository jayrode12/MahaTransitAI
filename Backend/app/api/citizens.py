import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.citizen import Citizen
from app.schemas.citizen import CitizenRegister, CitizenProfileResponse, CitizenProfileUpdate
from app.schemas.complaint import ComplaintListResponse
from app.services.citizen_service import CitizenService
from app.services.complaint_service import ComplaintService
from app.api.deps import get_current_citizen

router = APIRouter(prefix="/citizens", tags=["Citizens"])


@router.post(
    "/register",
    response_model=CitizenProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen",
)
def register_citizen(
    reg_in: CitizenRegister,
    db: Session = Depends(get_db),
):
    """
    Registers a new citizen via Supabase Auth and creates a profile in the citizens database.
    """
    return CitizenService.register(db=db, reg_in=reg_in)


@router.get(
    "/profile",
    response_model=CitizenProfileResponse,
    summary="Get current citizen profile",
)
def get_citizen_profile(
    current_citizen: Citizen = Depends(get_current_citizen),
):
    """
    Fetches profile for the currently authenticated citizen.
    """
    return CitizenService.get_profile(citizen=current_citizen)


@router.put(
    "/profile",
    response_model=CitizenProfileResponse,
    summary="Update citizen profile",
)
def update_citizen_profile(
    update_in: CitizenProfileUpdate,
    current_citizen: Citizen = Depends(get_current_citizen),
    db: Session = Depends(get_db),
):
    """
    Updates profile attributes (name, phone, language) for the authenticated citizen.
    """
    return CitizenService.update_profile(
        db=db,
        citizen=current_citizen,
        update_in=update_in,
    )


@router.get(
    "/{citizen_id}",
    response_model=CitizenProfileResponse,
    summary="Get citizen profile by ID",
)
def get_citizen_by_id(
    citizen_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Fetches a citizen profile by citizen UUID.
    """
    citizen = CitizenService.get_by_id(db=db, citizen_id=citizen_id)
    if not citizen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Citizen with ID '{citizen_id}' not found.",
        )
    return citizen


@router.get(
    "/{citizen_id}/complaints",
    response_model=ComplaintListResponse,
    summary="Get complaints for a specific citizen by ID",
)
def get_citizen_complaints(
    citizen_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
):
    """
    Retrieves complaints submitted by a specific citizen ID.
    """
    skip = (page - 1) * limit
    complaints, total = ComplaintService.get_complaints(
        db=db,
        skip=skip,
        limit=limit,
        citizen_id=citizen_id,
        status=status,
    )
    pages = math.ceil(total / limit) if total > 0 else 1
    return {
        "items": complaints,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
    }

