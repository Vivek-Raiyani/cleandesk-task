from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class TimesheetCreate(BaseModel):
    user_id: UUID
    project_name: str
    hours_logged: float = Field(..., gt=0, le=24, description="Hours logged must be between 0 and 24")
    task_description: Optional[str] = None

class TimesheetResponse(BaseModel):
    id: UUID
    user_full_name: str
    project_name: str
    hours_logged: float
    task_description: Optional[str]
    logged_at: datetime

    class Config:
        from_attributes = True
