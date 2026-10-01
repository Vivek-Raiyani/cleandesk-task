import hashlib
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Any
from datetime import datetime, timezone, timedelta

from core.deps import get_db
from models import AICacheLog
from schemas.ai import AITaskRequest, AITaskResponse

ai_router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)

import random

MOCK_RESPONSES = [
    {"summary": "Analyzed and optimized project workflow", "status": "success", "tokens_used": 120, "cost": 0.03},
    {"summary": "Refactored the communication template", "status": "success", "tokens_used": 200, "cost": 0.05},
    {"summary": "Generated comprehensive action plan", "status": "success", "tokens_used": 350, "cost": 0.09},
    {"summary": "Identified bottlenecks in the current process", "status": "success", "tokens_used": 150, "cost": 0.04},
]

@ai_router.post("/optimize-task", response_model=AITaskResponse)
async def optimize_task(
    request: AITaskRequest,
    db: Session = Depends(get_db)
):
    prompt_hash = hashlib.sha256(request.prompt.encode('utf-8')).hexdigest()
    
    cache_log = db.query(AICacheLog).filter(AICacheLog.prompt_hash == prompt_hash).first()
    
    if cache_log:
        CACHE_TTL_MINUTES = 30
        
        db_time = cache_log.updated_at
        if db_time.tzinfo is None:
            db_time = db_time.replace(tzinfo=timezone.utc)
            
        time_since_update = datetime.now(timezone.utc) - db_time
        
        if time_since_update < timedelta(minutes=CACHE_TTL_MINUTES):
            cached_cost = cache_log.response_payload.get("cost", 0.05)
            cache_log.call_count += 1
            cache_log.saved_compute_cost += cached_cost
            db.commit()
            db.refresh(cache_log)
            
            return AITaskResponse(
                response=cache_log.response_payload,
                cached=True,
                saved_compute_cost=cache_log.saved_compute_cost,
                call_count=cache_log.call_count
            )
        else:
            mock_response = random.choice(MOCK_RESPONSES).copy()
            mock_response["summary"] = f"{mock_response['summary']} (Prompt: '{request.prompt[:30]}...')"
            
            cache_log.response_payload = mock_response
            cache_log.call_count += 1
            db.commit()
            db.refresh(cache_log)
            
            return AITaskResponse(
                response=cache_log.response_payload,
                cached=False, 
                saved_compute_cost=cache_log.saved_compute_cost,
                call_count=cache_log.call_count
            )
    
    mock_response = random.choice(MOCK_RESPONSES).copy()
    mock_response["summary"] = f"{mock_response['summary']} (Prompt: '{request.prompt[:30]}...')"
    
    new_log = AICacheLog(
        prompt_hash=prompt_hash,
        response_payload=mock_response,
        call_count=1,
        saved_compute_cost=0.0  
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    
    return AITaskResponse(
        response=new_log.response_payload,
        cached=False,
        saved_compute_cost=new_log.saved_compute_cost,
        call_count=new_log.call_count
    )
