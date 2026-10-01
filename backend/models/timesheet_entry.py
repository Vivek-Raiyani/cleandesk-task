from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, UUID
from sqlalchemy.orm import relationship
from .base import BaseModel

class TimesheetEntry(BaseModel):
    __tablename__ = "timesheet_entries"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    project_name = Column(String, nullable=False)
    hours_logged = Column(Float, nullable=False)
    task_description = Column(Text, nullable=True)
    logged_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="timesheet_entries")

    @property
    def user_full_name(self):
        return self.user.full_name if self.user else None
