import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Enum, DateTime
from .base import BaseModel

class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"

class NotificationDispatch(BaseModel):
    __tablename__ = "notification_dispatches"

    recipient_email = Column(String, index=True, nullable=False)
    subject = Column(String, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.PENDING, nullable=False)
    triggered_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
