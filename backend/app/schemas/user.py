from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, EmailStr

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    profession: Optional[str] = None
    preferences: Optional[dict[str, Any]] = None

class UserPreferencesUpdate(BaseModel):
    notifications: Optional[bool] = True
    aiInsights: Optional[bool] = True
    journalReminders: Optional[bool] = True
    compactMode: Optional[bool] = False

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
    preferences: Optional[dict[str, Any]] = None
    created_at: datetime
    stats: Optional[UserStats] = None