from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field

class GoalStatusChange(BaseModel):
    goal_id: Optional[str] = None
    goal_title: str
    change: str  # e.g., "Progress marked", "Completed", "Ongoing"

class WeeklySummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    headline: str
    wins: list[str] = Field(default_factory=list)
    recurring_blockers: list[str] = Field(default_factory=list)
    goal_status_changes: list[dict[str, Any]] = Field(default_factory=list)
    mood_trend: str = "stable"  # improving | stable | declining
    coaching_suggestion: str = ""
    created_at: datetime
