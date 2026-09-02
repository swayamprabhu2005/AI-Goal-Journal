from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class HabitCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    frequency: str = "daily"


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100
    )
    description: Optional[str] = None
    frequency: Optional[str] = None


class HabitResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    frequency: str
    created_at: datetime
    updated_at: datetime


class HabitLogResponse(BaseModel):
    id: str
    habit_id: str
    completed_date: datetime
    created_at: datetime


class HabitStatusResponse(BaseModel):
    habit_id: str
    completed_today: bool
    current_streak: int