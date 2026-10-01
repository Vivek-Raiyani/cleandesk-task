from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from core.deps import get_db
from core.websockets import manager
from models import TimesheetEntry
from schemas.timesheet import TimesheetCreate, TimesheetResponse

timesheet_router = APIRouter(
    prefix="/timesheets",
    tags=["Timesheets"]
)

@timesheet_router.post("/log", response_model=TimesheetResponse)
async def log_timesheet(timesheet_in: TimesheetCreate, db: Session = Depends(get_db)):
    db_timesheet = TimesheetEntry(
        user_id=timesheet_in.user_id,
        project_name=timesheet_in.project_name,
        hours_logged=timesheet_in.hours_logged,
        task_description=timesheet_in.task_description
    )
    db.add(db_timesheet)
    db.commit()
    db.refresh(db_timesheet)
    
    update_msg = {
        "type": "NEW_TIMESHEET_LOGGED",
        "timesheet_id": str(db_timesheet.id),
        "user_full_name": db_timesheet.user_full_name,
        "project_name": db_timesheet.project_name,
        "hours_logged": db_timesheet.hours_logged
    }
    await manager.broadcast(update_msg)
    
    return db_timesheet

@timesheet_router.get("", response_model=List[TimesheetResponse])
async def get_timesheets(user_id: str = None, db: Session = Depends(get_db)):
    query = db.query(TimesheetEntry)
    if user_id:
        query = query.filter(TimesheetEntry.user_id == user_id)
    return query.all()
