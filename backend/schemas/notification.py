from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from models import NotificationStatus

class NotificationCreate(BaseModel):
    recipient_email: str
    subject: str

class NotificationResponse(BaseModel):
    id: UUID
    recipient_email: str
    subject: str
    status: NotificationStatus
    triggered_at: datetime

    class Config:
        from_attributes = True
