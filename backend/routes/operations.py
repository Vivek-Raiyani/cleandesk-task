from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.deps import get_db
from models import TimesheetEntry, AICacheLog, NotificationDispatch, NotificationStatus
from schemas.operations import OperationsSummaryResponse, TeamEfficiencyMetrics, AIExecutionMetrics, NotificationMetrics

operations_router = APIRouter(
    prefix="/operations",
    tags=["Operations"]
)

@operations_router.get("/summary", response_model=OperationsSummaryResponse)
async def get_operations_summary(db: Session = Depends(get_db)):
    total_hours = db.query(func.sum(TimesheetEntry.hours_logged)).scalar() or 0.0
    
    project_hours_raw = db.query(
        TimesheetEntry.project_name, 
        func.sum(TimesheetEntry.hours_logged)
    ).group_by(TimesheetEntry.project_name).all()
    
    hours_by_project = {row[0]: row[1] for row in project_hours_raw}

    team_metrics = TeamEfficiencyMetrics(
        total_hours_logged=total_hours,
        hours_by_project=hours_by_project
    )

    total_calls_recorded = db.query(func.sum(AICacheLog.call_count)).scalar() or 0
    total_fresh_calls = db.query(AICacheLog).count()
    total_cache_hits = max(0, total_calls_recorded - total_fresh_calls)
    total_saved_compute = db.query(func.sum(AICacheLog.saved_compute_cost)).scalar() or 0.0

    ai_metrics = AIExecutionMetrics(
        total_cache_hits=total_cache_hits,
        total_fresh_calls=total_fresh_calls,
        total_saved_compute=total_saved_compute
    )

    sent_count = db.query(NotificationDispatch).filter(NotificationDispatch.status == NotificationStatus.SENT).count()
    pending_count = db.query(NotificationDispatch).filter(NotificationDispatch.status == NotificationStatus.PENDING).count()
    failed_count = db.query(NotificationDispatch).filter(NotificationDispatch.status == NotificationStatus.FAILED).count()

    notification_metrics = NotificationMetrics(
        sent=sent_count,
        pending=pending_count,
        failed=failed_count
    )

    return OperationsSummaryResponse(
        team_efficiency=team_metrics,
        ai_optimization=ai_metrics,
        notification_stats=notification_metrics
    )
