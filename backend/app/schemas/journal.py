from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, Field

class ActivityStatus(str, Enum):
    COMPLETED = "completed"
    ONGOING = "ongoing"
    PLANNED = "planned"

class BlockerCategory(str, Enum):
    TIME = "time"
    DISTRACTION = "distraction"
    TECHNICAL = "technical"
    MOTIVATION = "motivation"
    UNCLEAR_TASK = "unclear_task"
    EXTERNAL = "external"
    OTHER = "other"

class ActivityItem(BaseModel):
    text: str
    status: ActivityStatus = ActivityStatus.COMPLETED
    related_goal_id: Optional[str] = None
    related_goal_title: Optional[str] = None

class BlockerItem(BaseModel):
    text: str
    category: str = "other"

class GoalSuggestionItem(BaseModel):
    text: str
    is_new: bool = True
    matched_existing_goal_id: Optional[str] = None
    matched_existing_goal_title: Optional[str] = None

class AIAnalysisResult(BaseModel):
    mood: str = "neutral"  # positive | neutral | reflective | overwhelmed | motivated
    mood_confidence: float = 0.8
    activities: list[ActivityItem] = Field(default_factory=list)
    goals: list[GoalSuggestionItem] = Field(default_factory=list)
    blockers: list[BlockerItem] = Field(default_factory=list)
    insights: list[str] = Field(default_factory=list)
    quick_summary: Optional[str] = None

class JournalCreate(BaseModel):
    content: str = Field(..., min_length=1)
    source: str = "text"  # text | voice
    transcript_raw: Optional[str] = None

class JournalUpdate(BaseModel):
    content: str = Field(..., min_length=1)

class JournalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    content: str
    source: str
    ai_analysis: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
