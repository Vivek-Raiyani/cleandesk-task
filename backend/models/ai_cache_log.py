from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from .base import BaseModel

class AICacheLog(BaseModel):
    __tablename__ = "ai_cache_logs"

    prompt_hash = Column(String, unique=True, index=True, nullable=False)
    response_payload = Column(JSON, nullable=False)
    call_count = Column(Integer, default=1)
    saved_compute_cost = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
