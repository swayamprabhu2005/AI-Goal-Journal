from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    profession: Optional[str] = None

class UserStats(BaseModel):
    total_journals: int = 0
    active_goals: int = 0
    completed_goals: int = 0
    stalled_goals: int = 0
    active_blockers_count: int = 0

class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    firebase_uid: str
    email: str
    display_name: Optional[str] = None
    profession: Optional[str] = None
    created_at: datetime
    stats: Optional[UserStats] = None