import math
from typing import Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintResponse,
    ComplaintListResponse,
    ComplaintRemarkCreate,
    ComplaintRemarkResponse,
    ComplaintAttachmentCreate,
    ComplaintAttachmentResponse,
)
from app.services.complaint_service import ComplaintService

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new public transport complaint",
)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
):
    """
    Creates a new complaint for Metro, BEST Bus, or Local Trains.
    Generates a unique ticket number, triggers AI models, and saves results.
    """
    return ComplaintService.create_complaint(db=db, complaint_in=complaint_in)


@router.get(
    "",
    response_model=ComplaintListResponse,
    summary="Get list of complaints with search, filters and pagination",
)
def list_complaints(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status: PENDING, IN_PROGRESS, RESOLVED, REJECTED, CLOSED"),
    priority: Optional[str] = Query(None, description="Filter by priority: LOW, MEDIUM, HIGH, CRITICAL"),
    transit_mode: Optional[str] = Query(None, description="Filter by transit mode: metro, bus, train"),
    department_id: Optional[UUID] = Query(None, description="Filter by department UUID"),
    category_id: Optional[UUID] = Query(None, description="Filter by category UUID"),
    citizen_id: Optional[UUID] = Query(None, description="Filter by citizen UUID"),
    search: Optional[str] = Query(None, description="Search keyword across title, description, and ticket number"),
    from_date: Optional[str] = Query(None, description="Filter complaints created on or after YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Filter complaints created on or before YYYY-MM-DD"),
    sort_by: Optional[str] = Query("priority_date", description="Sort order: priority_date or date"),
    db: Session = Depends(get_db),
):
    """
    Retrieves paginated complaints with keyword search, date filtering, and multi-attribute filters.
    """
    skip = (page - 1) * limit
    complaints, total = ComplaintService.get_complaints(
        db=db,
        skip=skip,
        limit=limit,
        citizen_id=citizen_id,
        department_id=department_id,
        category_id=category_id,
        status=status,
        priority=priority,
        transit_mode=transit_mode,
        search=search,
        from_date=from_date,
        to_date=to_date,
        sort_by=sort_by,
    )
    pages = math.ceil(total / limit) if total > 0 else 1
    return {
        "items": complaints,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
    }


@router.get(
    "/stats",
    summary="Get aggregated statistics for agency dashboard",
)
def get_complaint_stats(
    transit_mode: Optional[str] = Query(None, description="Filter by transit mode: metro, bus, train, or all"),
    department_id: Optional[UUID] = Query(None, description="Filter by department UUID"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Returns aggregated counts (total, pending, high priority, resolved) and chart distributions
    tailored to the selected transport authority.
    """
    return ComplaintService.get_complaint_stats(
        db=db,
        transit_mode=transit_mode,
        department_id=department_id,
    )


@router.get(
    "/track/{ticket_number}",
    response_model=ComplaintResponse,
    summary="Public tracking of complaint by ticket number",
)
def track_complaint(
    ticket_number: str,
    db: Session = Depends(get_db),
):
    """
    Allows citizens to track complaint status using their unique ticket number (e.g. MT-MET-202609-XXXX).
    """
    complaint = ComplaintService.get_complaint_by_ticket_number(db=db, ticket_number=ticket_number.strip())
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ticket number '{ticket_number}' not found.",
        )
    return complaint


@router.get(
    "/{complaint_id}",
    response_model=ComplaintResponse,
    summary="Get complaint details by ID",
)
def get_complaint(
    complaint_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Retrieves full complaint details including attachments, timeline remarks, and AI insights.
    """
    complaint = ComplaintService.get_complaint_by_id(db=db, complaint_id=complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID '{complaint_id}' not found.",
        )
    return complaint


@router.patch(
    "/{complaint_id}",
    response_model=ComplaintResponse,
    summary="Update complaint status, priority, or remarks",
)
def update_complaint(
    complaint_id: UUID,
    complaint_in: ComplaintUpdate,
    db: Session = Depends(get_db),
):
    """
    Updates complaint status, priority, or adds resolution remarks.
    Automatically records timeline history.
    """
    updated = ComplaintService.update_complaint(db=db, complaint_id=complaint_id, complaint_in=complaint_in)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID '{complaint_id}' not found.",
        )
    return updated


@router.post(
    "/{complaint_id}/remarks",
    response_model=ComplaintRemarkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add official remark / timeline event",
)
def add_complaint_remark(
    complaint_id: UUID,
    remark_in: ComplaintRemarkCreate,
    db: Session = Depends(get_db),
):
    """
    Adds a new official remark / progress note to a complaint timeline.
    """
    try:
        return ComplaintService.add_remark(db=db, complaint_id=complaint_id, remark_in=remark_in)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
