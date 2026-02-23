from core.database import SessionLocal, ComplaintDB, ClusterDB, WorkOrderDB
from datetime import datetime, timedelta
from typing import Optional
import uuid
import logging

logger = logging.getLogger(__name__)

def gen_id(prefix: str) -> str:
    return f"{prefix}-{str(uuid.uuid4())[:8].upper()}"

def save_complaint(
    issue_type: str,
    description: str,
    location_text: str,
    lat: Optional[float] = None,       # ← Optional, not float
    lng: Optional[float] = None,       # ← Optional, not float
    ward: Optional[str] = None,
    zone: Optional[str] = None,
    severity: str = "moderate",
    citizen_email: Optional[str] = None,
    image_url: Optional[str] = None,
    streetview_url: Optional[str] = None
) -> dict:
    """Save new complaint to database."""
    logger.info("  → PortalPublisherAgent: saving complaint to database")
    db = SessionLocal()
    try:
        complaint = ComplaintDB(
            id=gen_id("CIV"),
            issue_type=issue_type,
            description=description,
            location_text=location_text,
            lat=lat,
            lng=lng,
            ward=ward,
            zone=zone,
            severity=severity,
            citizen_email=citizen_email,
            image_url=image_url,
            streetview_url=streetview_url
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        logger.info("     ✓ Complaint saved: %s", complaint.id)
        return {"complaint_id": complaint.id, "status": "saved"}
    except Exception as e:
        db.rollback()
        logger.error("     ✗ Failed to save complaint: %s", str(e)[:100])
        return {"complaint_id": None, "status": "error", "error": str(e)}
    finally:
        db.close()

def update_complaint_status(
    complaint_id: str,
    status: str,
    priority: Optional[str] = None,
    work_order_id: Optional[str] = None,
    prediction: Optional[str] = None,
    department: Optional[str] = None,
    dept_email: Optional[str] = None,
    officer_name: Optional[str] = None
) -> dict:
    """Update complaint status and related fields."""
    db = SessionLocal()
    try:
        c = db.query(ComplaintDB).filter(
            ComplaintDB.id == complaint_id
        ).first()
        if not c:
            return {"error": f"Complaint {complaint_id} not found"}
        c.status = status  # type: ignore[assignment]
        if priority:      c.priority = priority  # type: ignore[assignment]
        if work_order_id: c.work_order_id = work_order_id  # type: ignore[assignment]
        if prediction:    c.prediction = prediction  # type: ignore[assignment]
        if department:    c.department = department  # type: ignore[assignment]
        if dept_email:    c.dept_email = dept_email  # type: ignore[assignment]
        if officer_name:  c.officer_name = officer_name  # type: ignore[assignment]
        if status == "resolved":
            c.resolved_at = datetime.utcnow()  # type: ignore[assignment]
        db.commit()
        return {"complaint_id": complaint_id, "status": status}
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()

def query_complaints_by_filter(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    issue_type: Optional[str] = None,
    days: int = 7
) -> list:
    """Query complaints with optional filters."""
    db = SessionLocal()
    try:
        q = db.query(ComplaintDB)
        since = datetime.utcnow() - timedelta(days=days)
        q = q.filter(ComplaintDB.submitted_at >= since)
        if status:     q = q.filter(ComplaintDB.status == status)
        if priority:   q = q.filter(ComplaintDB.priority == priority)
        if issue_type: q = q.filter(ComplaintDB.issue_type == issue_type)
        results = q.order_by(ComplaintDB.submitted_at.desc()).all()
        return [
            {
                "id":           c.id,
                "type":         c.issue_type,
                "location":     c.location_text or "",
                "status":       c.status or "open",
                "priority":     c.priority or "P3",
                "lat":          c.lat,
                "lng":          c.lng,
                "severity":     c.severity or "moderate",
                "image_url":    c.image_url,
                "submitted_at": str(c.submitted_at)
            }
            for c in results
        ]
    except Exception as e:
        return [{"error": str(e)}]
    finally:
        db.close()

def save_cluster(
    issue_type: str,
    center_lat: float,
    center_lng: float,
    radius_m: int,
    size: int,
    score: float,
    location_text: str
) -> dict:
    """Save a new geo-cluster to database."""
    db = SessionLocal()
    try:
        cluster = ClusterDB(
            id=gen_id("CLU"),
            issue_type=issue_type,
            center_lat=center_lat,
            center_lng=center_lng,
            radius_m=radius_m,
            size=size,
            score=score,
            priority="pending",
            location_text=location_text
        )
        db.add(cluster)
        db.commit()
        db.refresh(cluster)
        return {"cluster_id": cluster.id, "score": score, "size": size}
    except Exception as e:
        db.rollback()
        return {"cluster_id": None, "error": str(e)}
    finally:
        db.close()

def fetch_historical_clusters(
    issue_type: str,
    min_size: int = 3
) -> list:
    """Fetch past clusters of same type for prediction context."""
    db = SessionLocal()
    try:
        clusters = db.query(ClusterDB).filter(
            ClusterDB.issue_type == issue_type,
            ClusterDB.size >= min_size
        ).order_by(ClusterDB.created_at.desc()).limit(10).all()
        return [
            {
                "id":       c.id,
                "size":     c.size,
                "score":    c.score,
                "priority": c.priority or "P3",
                "location": c.location_text or ""
            }
            for c in clusters
        ]
    except Exception as e:
        return [{"error": str(e)}]
    finally:
        db.close()

def save_work_order(
    complaint_id: str,
    department: str,
    dept_email: str,
    officer_name: str,
    email_body: str,
    cluster_id: Optional[str] = None
) -> dict:
    """Save dispatched work order to database."""
    db = SessionLocal()
    try:
        wo = WorkOrderDB(
            id=gen_id("WO"),
            complaint_id=complaint_id,
            cluster_id=cluster_id,
            department=department,
            dept_email=dept_email,
            officer_name=officer_name,
            email_body=email_body
        )
        db.add(wo)
        db.commit()
        db.refresh(wo)
        return {"work_order_id": wo.id, "status": "saved"}
    except Exception as e:
        db.rollback()
        return {"work_order_id": None, "error": str(e)}
    finally:
        db.close()

def get_trend_data(group_by: str = "zone", days: int = 7) -> list:
    """Get complaint trend data grouped by zone or type."""
    db = SessionLocal()
    try:
        since = datetime.utcnow() - timedelta(days=days)
        complaints = db.query(ComplaintDB).filter(
            ComplaintDB.submitted_at >= since
        ).all()

        from collections import defaultdict
        groups: dict = defaultdict(int)
        for c in complaints:
            key = getattr(c, group_by, "unknown") or "unknown"
            groups[str(key)] += 1

        return [{"group": k, "count": v}
                for k, v in sorted(groups.items(),
                                   key=lambda x: x[1], reverse=True)]
    except Exception as e:
        return [{"error": str(e)}]
    finally:
        db.close()
