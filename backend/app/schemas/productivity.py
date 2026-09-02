from pydantic import BaseModel, Field
from typing import Optional


class ProductivityBreakdown(BaseModel):
    goal_progress_score: float = Field(..., ge=0, le=100)
    goal_completion_score: float = Field(..., ge=0, le=100)
    completed_activities_score: float = Field(..., ge=0, le=100)
    journal_consistency_score: float = Field(..., ge=0, le=100)
    base_score: float = Field(..., ge=0, le=100)
    blocker_penalty: float = Field(..., ge=0, le=15)
    total_blockers_last_7_days: int = 0
    active_goals_count: int = 0
    completed_activities_count: int = 0
    days_journaled_last_7_days: int = 0


class ProductivityScoreResponse(BaseModel):
    final_score: int = Field(..., ge=0, le=100)
    breakdown: ProductivityBreakdown
    message: Optional[str] = None