from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class GoalStatus(str, Enum):
    ACTIVE = "Active"
    COMPLETED = "Completed"
    STALLED = "Stalled"

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    status: GoalStatus = GoalStatus.ACTIVE
    target_date: Optional[str] = None

class GoalUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[GoalStatus] = None
    target_date: Optional[str] = None

class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: str
    target_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime
