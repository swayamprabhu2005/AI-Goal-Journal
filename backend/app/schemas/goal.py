from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class GoalStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    STALLED = "Stalled"

class GoalPriority(str, Enum):
    HIGH = "High Priority"
    MEDIUM = "Medium Priority"
    LOW = "Low Priority"

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    status: GoalStatus = GoalStatus.ACTIVE
    priority: Optional[str] = Field(None, description="Optional manual or AI-calculated priority")
    target_date: Optional[str] = None
    progress_value: Optional[int] = Field(0, ge=0, le=100)

class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[GoalStatus] = None
    priority: Optional[str] = None
    target_date: Optional[str] = None
    progress_value: Optional[int] = Field(None, ge=0, le=100)
    latest_progress_note: Optional[str] = None

class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: str
    priority: Optional[str] = "Medium Priority"
    target_date: Optional[str] = None
    progress_value: int = 0
    latest_progress_note: Optional[str] = None
    estimated_days_remaining: Optional[int] = None
    created_at: datetime
    updated_at: datetime
