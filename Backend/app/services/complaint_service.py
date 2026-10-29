import logging
import random
import string
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID

from sqlalchemy import or_, func, text
from sqlalchemy.orm import Session, joinedload

from app.models.complaint import (
    Complaint,
    ComplaintAttachment,
    ComplaintRemark,
    Department,
    Notification,
    AIResult,
    DuplicateComplaint,
)
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintRemarkCreate,
    ComplaintAttachmentCreate,
)

logger = logging.getLogger(__name__)


class ComplaintService:
    """
    Service Layer encapsulating all business logic for Complaint Management.
    """

    @staticmethod
    def generate_ticket_number(transit_mode: Optional[str] = None) -> str:
        """
        Generates a unique human-readable ticket tracking number.
        Format: MT-[MODE]-[YEAR][MONTH]-[RANDOM4] e.g., MT-MET-202609-A7B2
        """
        now = datetime.utcnow()
        mode_prefix = "GEN"
        if transit_mode:
            clean_mode = transit_mode.strip().upper()
            if "METRO" in clean_mode:
                mode_prefix = "MET"
            elif "BUS" in clean_mode:
                mode_prefix = "BUS"
            elif "TRAIN" in clean_mode:
                mode_prefix = "TRN"
            else:
                mode_prefix = clean_mode[:3]

        random_suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        return f"MT-{mode_prefix}-{now.strftime('%Y%m')}-{random_suffix}"

    @classmethod
    def resolve_department_id(cls, db: Session, transit_mode: str) -> Optional[UUID]:
        """
        Finds the matching department UUID for a given transit mode.
        """
        m = (transit_mode or "metro").lower()
        if "metro" in m:
            dept = db.query(Department).filter(Department.name.ilike("%Metro%")).first()
        elif "bus" in m or "best" in m:
            dept = db.query(Department).filter(Department.name.ilike("%BEST%")).first()
        elif "train" in m or "railway" in m or "local" in m:
            dept = (
                db.query(Department)
                .filter(
                    or_(
                        Department.name.ilike("%Suburban%"),
                        Department.name.ilike("%Local%"),
                        Department.name.ilike("%Railway%"),
                    )
                )
                .first()
            )
        else:
            dept = db.query(Department).first()

        return dept.id if dept else None

    @classmethod
    def create_complaint(
        cls,
        db: Session,
        complaint_in: ComplaintCreate,
        citizen_id: Optional[UUID] = None,
    ) -> Complaint:
        """
        Creates a new complaint, auto-resolves department, saves attachments,
        records initial timeline remark, and triggers the automated AI pipeline.
        """
        effective_citizen_id = complaint_in.citizen_id or citizen_id
        transit_mode_val = complaint_in.transit_mode.lower() if complaint_in.transit_mode else "metro"
        priority_val = (complaint_in.priority or "medium").lower()
        language_val = (complaint_in.language or "en").lower()

        # Auto-resolve department if not provided
        department_id = complaint_in.department_id
        if not department_id:
            department_id = cls.resolve_department_id(db, transit_mode_val)

        # Generate unique ticket number
        ticket_number = cls.generate_ticket_number(transit_mode_val)
        while db.query(Complaint).filter(Complaint.ticket_number == ticket_number).first():
            ticket_number = cls.generate_ticket_number(transit_mode_val)

        # Instantiate Complaint model
        db_complaint = Complaint(
            ticket_number=ticket_number,
            citizen_id=effective_citizen_id,
            department_id=department_id,
            category_id=complaint_in.category_id,
            transit_mode=transit_mode_val,
            form_data=complaint_in.form_data or {},
            title=complaint_in.title,
            description_original=complaint_in.description_original,
            language=language_val,
            priority=priority_val,
            status="submitted",
        )
        db.add(db_complaint)
        db.flush()

        # Add attachments if provided in payload
        if complaint_in.attachments:
            for att in complaint_in.attachments:
                db_attachment = ComplaintAttachment(
                    complaint_id=db_complaint.id,
                    attachment_type=att.attachment_type.lower(),
                    file_name=att.file_name,
                    file_url=att.file_url,
                    mime_type=att.mime_type,
                    file_size=att.file_size,
                )
                db.add(db_attachment)

        # Log initial creation entry in Complaint Remarks (Timeline)
        initial_remark = ComplaintRemark(
            complaint_id=db_complaint.id,
            status="submitted",
            remarks="Complaint registered into centralized transport network.",
            updated_by=None,
        )
        db.add(initial_remark)

        db.commit()
        db.refresh(db_complaint)

        # Trigger Automated AI Pipeline
        try:
            from app.services.ai.pipeline import run_full_complaint_ai_pipeline
            logger.info("Executing automated AI pipeline for new complaint: %s", db_complaint.ticket_number)
            ai_summary = run_full_complaint_ai_pipeline(complaint_id=db_complaint.id, db=db)
            if ai_summary.get("translated_text") and not db_complaint.description_english:
                db_complaint.description_english = ai_summary["translated_text"]
                db.commit()
            db.refresh(db_complaint)
            logger.info("AI pipeline executed successfully: %s", ai_summary.get("predicted_priority"))
        except Exception as e:
            logger.warning("Automated AI pipeline execution encountered error: %s", e)

        return db_complaint

    @staticmethod
    def get_complaint_by_id(db: Session, complaint_id: UUID) -> Optional[Complaint]:
        """
        Fetches a complaint by UUID along with attachments, timeline remarks, and AI results.
        """
        return (
            db.query(Complaint)
            .options(
                joinedload(Complaint.attachments),
                joinedload(Complaint.remarks),
                joinedload(Complaint.department),
                joinedload(Complaint.category),
                joinedload(Complaint.ai_result),
            )
            .filter(Complaint.id == complaint_id)
            .first()
        )

    @staticmethod
    def get_complaint_by_ticket_number(db: Session, ticket_number: str) -> Optional[Complaint]:
        """
        Fetches a complaint by ticket tracking number (for public or direct lookup).
        """
        return (
            db.query(Complaint)
            .options(
                joinedload(Complaint.attachments),
                joinedload(Complaint.remarks),
                joinedload(Complaint.department),
                joinedload(Complaint.category),
                joinedload(Complaint.ai_result),
            )
            .filter(Complaint.ticket_number == ticket_number)
            .first()
        )

    @staticmethod
    def get_complaints(
        db: Session,
        skip: int = 0,
        limit: int = 20,
        citizen_id: Optional[UUID] = None,
        department_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        transit_mode: Optional[str] = None,
        search: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        sort_by: Optional[str] = "priority_date",
    ) -> Tuple[List[Complaint], int]:
        """
        Queries complaints with multi-attribute filtering, date range, search, and priority+date sorting.
        """
        query = db.query(Complaint)

        if citizen_id:
            query = query.filter(Complaint.citizen_id == citizen_id)
        if department_id:
            query = query.filter(Complaint.department_id == department_id)
        if category_id:
            query = query.filter(Complaint.category_id == category_id)

        if status:
            s_clean = status.lower().strip()
            if s_clean in ["pending", "active"]:
                query = query.filter(Complaint.status.in_(["submitted", "assigned", "accepted"]))
            elif s_clean in ["in progress", "in_progress"]:
                query = query.filter(Complaint.status == "in_progress")
            elif s_clean in ["resolved", "closed"]:
                query = query.filter(Complaint.status.in_(["resolved", "closed"]))
            elif "," in s_clean:
                statuses = [st.strip() for st in s_clean.split(",")]
                query = query.filter(Complaint.status.in_(statuses))
            else:
                query = query.filter(Complaint.status == s_clean)

        if priority:
            p_clean = priority.lower().strip()
            if "," in p_clean:
                priorities = [p.strip() for p in p_clean.split(",")]
                query = query.filter(Complaint.priority.in_(priorities))
            else:
                query = query.filter(Complaint.priority == p_clean)

        if transit_mode:
            t_clean = transit_mode.lower().strip()
            if t_clean not in ["all", ""]:
                query = query.filter(Complaint.transit_mode == t_clean)

        # Date Filtering (from_date and to_date)
        if from_date:
            try:
                dt_from = datetime.strptime(from_date.strip(), "%Y-%m-%d")
                query = query.filter(Complaint.created_at >= dt_from)
            except ValueError:
                pass

        if to_date:
            try:
                dt_to = datetime.strptime(to_date.strip(), "%Y-%m-%d").replace(hour=23, minute=59, second=59)
                query = query.filter(Complaint.created_at <= dt_to)
            except ValueError:
                pass

        # Keyword Search across Title, Description, and Ticket Number
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Complaint.title.ilike(search_pattern),
                    Complaint.description_original.ilike(search_pattern),
                    Complaint.ticket_number.ilike(search_pattern),
                )
            )

        total = query.count()

        # Ordering: Date-wise (Newest first), then Assigned Priority (Critical -> High -> Medium -> Low)
        from sqlalchemy import case
        priority_weight = case(
            (Complaint.priority == "critical", 1),
            (Complaint.priority == "high", 2),
            (Complaint.priority == "medium", 3),
            (Complaint.priority == "low", 4),
            else_=5,
        )

        query_ordered = query.options(
            joinedload(Complaint.attachments),
            joinedload(Complaint.remarks),
            joinedload(Complaint.ai_result),
            joinedload(Complaint.department),
        )

        if sort_by == "priority_date":
            query_ordered = query_ordered.order_by(priority_weight.asc(), Complaint.created_at.desc())
        else:
            query_ordered = query_ordered.order_by(Complaint.created_at.desc(), priority_weight.asc())

        complaints = (
            query_ordered
            .offset(skip)
            .limit(limit)
            .all()
        )

        return complaints, total

    @staticmethod
    def get_complaint_stats(
        db: Session,
        transit_mode: Optional[str] = None,
        department_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Aggregates agency-specific complaint statistics for the dashboard.
        """
        base_query = db.query(Complaint)
        if transit_mode and transit_mode.lower() not in ["all", ""]:
            base_query = base_query.filter(Complaint.transit_mode == transit_mode.lower())
        if department_id:
            base_query = base_query.filter(Complaint.department_id == department_id)

        all_complaints = base_query.all()
        total = len(all_complaints)

        pending_count = 0
        in_progress_count = 0
        resolved_count = 0
        closed_count = 0
        high_priority_count = 0
        med_priority_count = 0
        low_priority_count = 0
        critical_priority_count = 0

        line_counts: Dict[str, int] = {}

        for c in all_complaints:
            s = (c.status or "").lower()
            p = (c.priority or "").lower()

            if s in ["submitted", "assigned", "accepted"]:
                pending_count += 1
            elif s == "in_progress":
                in_progress_count += 1
            elif s == "resolved":
                resolved_count += 1
            elif s == "closed":
                closed_count += 1

            if p == "critical":
                critical_priority_count += 1
                high_priority_count += 1
            elif p == "high":
                high_priority_count += 1
            elif p == "medium":
                med_priority_count += 1
            elif p == "low":
                low_priority_count += 1

            # Extract line/route information for pie chart
            line_name = "General"
            if c.form_data and isinstance(c.form_data, dict):
                line_name = (
                    c.form_data.get("line")
                    or c.form_data.get("route")
                    or c.form_data.get("line_or_route_number")
                    or c.form_data.get("bus_number")
                    or c.form_data.get("local_line")
                    or "General"
                )
            line_counts[line_name] = line_counts.get(line_name, 0) + 1

        pie_data = [
            {"name": k, "value": v}
            for k, v in sorted(line_counts.items(), key=lambda x: x[1], reverse=True)[:6]
        ]

        bar_data = [
            {"name": "Critical", "value": critical_priority_count, "fill": "#b91c1c"},
            {"name": "High Priority", "value": high_priority_count - critical_priority_count, "fill": "#ef4444"},
            {"name": "Medium Priority", "value": med_priority_count, "fill": "#f59e0b"},
            {"name": "Low Priority", "value": low_priority_count, "fill": "#22c55e"},
        ]

        return {
            "total": total,
            "pending": pending_count,
            "in_progress": in_progress_count,
            "resolved": resolved_count + closed_count,
            "high_priority": high_priority_count,
            "medium_priority": med_priority_count,
            "low_priority": low_priority_count,
            "critical_priority": critical_priority_count,
            "critical": critical_priority_count,
            "high": high_priority_count,
            "medium": med_priority_count,
            "low": low_priority_count,
            "pie_data": pie_data,
            "bar_data": bar_data,
        }

    @staticmethod
    def update_complaint(
        db: Session,
        complaint_id: UUID,
        complaint_in: ComplaintUpdate,
        updated_by: Optional[UUID] = None,
    ) -> Optional[Complaint]:
        """
        Updates complaint fields, handles status transitions (resolved/closed timestamps),
        and logs timeline remarks.
        """
        db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not db_complaint:
            return None

        status_changed = False
        old_status = db_complaint.status

        # Update status if provided
        if complaint_in.status:
            new_status_val = complaint_in.status.lower()
            if db_complaint.status != new_status_val:
                db_complaint.status = new_status_val
                status_changed = True
                if new_status_val == "resolved":
                    db_complaint.resolved_at = datetime.utcnow()
                elif new_status_val == "closed":
                    db_complaint.closed_at = datetime.utcnow()

        content_edited = False
        if complaint_in.title is not None and complaint_in.title != db_complaint.title:
            db_complaint.title = complaint_in.title
            content_edited = True
        if complaint_in.description_original is not None and complaint_in.description_original != db_complaint.description_original:
            db_complaint.description_original = complaint_in.description_original
            content_edited = True
        if complaint_in.form_data is not None:
            db_complaint.form_data = complaint_in.form_data
            content_edited = True

        # When edited by citizen, refresh timestamps to reflect submission time of edited data
        if content_edited:
            now_dt = datetime.utcnow()
            db_complaint.created_at = now_dt
            db_complaint.updated_at = now_dt
            if not complaint_in.remarks:
                complaint_in.remarks = f"Complaint details revised by citizen on {now_dt.strftime('%d %b %Y, %I:%M %p')}."

        # Update other fields
        if complaint_in.priority:
            db_complaint.priority = complaint_in.priority.lower()
        if complaint_in.department_id is not None:
            db_complaint.department_id = complaint_in.department_id
        if complaint_in.category_id is not None:
            db_complaint.category_id = complaint_in.category_id
        if complaint_in.feedback_rating is not None:
            db_complaint.feedback_rating = complaint_in.feedback_rating
        if complaint_in.feedback_comments is not None:
            db_complaint.feedback_comments = complaint_in.feedback_comments

        # Log timeline remark if status changed, content edited, or remarks provided
        if status_changed or content_edited or complaint_in.remarks:
            remark_text = complaint_in.remarks or f"Status changed from '{old_status}' to '{db_complaint.status}'."
            timeline_entry = ComplaintRemark(
                complaint_id=db_complaint.id,
                status=db_complaint.status,
                remarks=remark_text,
                updated_by=updated_by,
            )
            db.add(timeline_entry)

        db.commit()
        db.refresh(db_complaint)
        return db_complaint

    @staticmethod
    def add_remark(
        db: Session,
        complaint_id: UUID,
        remark_in: ComplaintRemarkCreate,
        updated_by: Optional[UUID] = None,
    ) -> ComplaintRemark:
        """
        Appends an official remark to the complaint timeline.
        """
        db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not db_complaint:
            raise ValueError(f"Complaint with ID '{complaint_id}' not found.")

        current_status = remark_in.status.lower() if remark_in.status else db_complaint.status
        if remark_in.status and remark_in.status.lower() != db_complaint.status:
            db_complaint.status = remark_in.status.lower()

        new_remark = ComplaintRemark(
            complaint_id=complaint_id,
            status=current_status,
            remarks=remark_in.remarks,
            updated_by=updated_by,
        )
        db.add(new_remark)
        db.commit()
        db.refresh(new_remark)
        return new_remark
