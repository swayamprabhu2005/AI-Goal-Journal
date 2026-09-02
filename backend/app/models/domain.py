from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Any
import uuid

@dataclass
class User:
    firebase_uid: str
    email: str
    display_name: Optional[str] = None
    profession: Optional[str] = None
    preferences: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Goal:
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: str = "Active"  # Active | Completed | Stalled
    priority: Optional[str] = "Medium Priority"  # High Priority | Medium Priority | Low Priority
    target_date: Optional[str] = None
    progress_value: int = 0
    latest_progress_note: Optional[str] = None
    estimated_days_remaining: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
@dataclass
class Progress:
    id: str
    goal_id: str
    progress_value: int
    note: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Progress:
    id: str
    goal_id: str
    progress_value: int
    note: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class JournalEntry:
    id: str
    user_id: str
    content: str
    source: str = "text"  # text | voice
    title: Optional[str] = None
    ai_analysis: Optional[dict[str, Any]] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class WeeklySummary:
    id: str
    user_id: str
    headline: str
    wins: list[str] = field(default_factory=list)
    recurring_blockers: list[str] = field(default_factory=list)
    goal_status_changes: list[dict[str, Any]] = field(default_factory=list)
    mood_trend: str = "stable"  # improving | stable | declining
    coaching_suggestion: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class Habit:
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    frequency: str = "daily"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class HabitLog:
    id: str
    habit_id: str
    completed_date: datetime
    created_at: datetime = field(default_factory=datetime.utcnow)
    