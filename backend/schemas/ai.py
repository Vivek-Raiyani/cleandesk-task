from pydantic import BaseModel
from typing import Any

class AITaskRequest(BaseModel):
    prompt: str

class AITaskResponse(BaseModel):
    response: Any
    cached: bool
    saved_compute_cost: float
    call_count: int
