from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import time
import asyncio

from core.websockets import manager

from core.deps import get_db
from core.database import SessionLocal
from models import NotificationDispatch, NotificationStatus
from schemas.notification import NotificationCreate, NotificationResponse

notifications_router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)

def process_notification_dispatch(notification_id: str):
    """Background task to simulate sending an email and updating status."""
    time.sleep(10)
    db = SessionLocal()
    try:
        notification = db.query(NotificationDispatch).filter(NotificationDispatch.id == notification_id).first()
        if notification:
            notification.status = NotificationStatus.SENT
            db.commit()
            
            update_msg = {
                "type": "NOTIFICATION_STATUS_UPDATE",
                "notification_id": str(notification.id),
                "status": notification.status.value,
                "recipient_email": notification.recipient_email
            }
            asyncio.run(manager.broadcast(update_msg))
    finally:
        db.close()

@notifications_router.post("/trigger", response_model=NotificationResponse)
async def trigger_notification(
    notification_in: NotificationCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    db_notification = NotificationDispatch(
        recipient_email=notification_in.recipient_email,
        subject=notification_in.subject,
        status=NotificationStatus.PENDING
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    background_tasks.add_task(process_notification_dispatch, db_notification.id)
    
    return db_notification

@notifications_router.get("", response_model=List[NotificationResponse])
async def list_notifications(db: Session = Depends(get_db)):
    """List all dispatched notifications ordered by most recent"""
    notifications = db.query(NotificationDispatch).order_by(NotificationDispatch.triggered_at.desc()).all()
    return notifications
