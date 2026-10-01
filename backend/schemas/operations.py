from pydantic import BaseModel
from typing import Dict

class TeamEfficiencyMetrics(BaseModel):
    total_hours_logged: float
    hours_by_project: Dict[str, float]

class AIExecutionMetrics(BaseModel):
    total_cache_hits: int
    total_fresh_calls: int
    total_saved_compute: float

class NotificationMetrics(BaseModel):
    sent: int
    pending: int
    failed: int

class OperationsSummaryResponse(BaseModel):
    team_efficiency: TeamEfficiencyMetrics
    ai_optimization: AIExecutionMetrics
    notification_stats: NotificationMetrics
