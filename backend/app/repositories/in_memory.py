import threading
from datetime import datetime
from typing import Optional, Any
from app.models.domain import User, Goal, JournalEntry, WeeklySummary
from app.repositories.base import (
    AbstractUserRepository,
    AbstractGoalRepository,
    AbstractJournalRepository,
    AbstractSummaryRepository,
)

class InMemoryUserRepository(AbstractUserRepository):
    def __init__(self):
        self._lock = threading.Lock()
        self._users: dict[str, User] = {}

    def get_or_create(self, uid: str, email: str, name: Optional[str] = None) -> User:
        with self._lock:
            if uid not in self._users:
                self._users[uid] = User(
                    firebase_uid=uid,
                    email=email,
                    display_name=name,
                    profession=None,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
            elif name and not self._users[uid].display_name:
                self._users[uid].display_name = name
                self._users[uid].updated_at = datetime.utcnow()
            return self._users[uid]

    def get_by_uid(self, uid: str) -> Optional[User]:
        with self._lock:
            return self._users.get(uid)

    def update_profile(
        self, uid: str, display_name: Optional[str] = None, profession: Optional[str] = None
    ) -> Optional[User]:
        with self._lock:
            user = self._users.get(uid)
            if not user:
                return None
            if display_name is not None:
                user.display_name = display_name
            if profession is not None:
                user.profession = profession
            user.updated_at = datetime.utcnow()
            return user


class InMemoryGoalRepository(AbstractGoalRepository):
    def __init__(self):
        self._lock = threading.Lock()
        # Keyed by user_id -> dict of goal_id -> Goal
        self._user_goals: dict[str, dict[str, Goal]] = {}

    def create(self, goal: Goal) -> Goal:
        with self._lock:
            if goal.user_id not in self._user_goals:
                self._user_goals[goal.user_id] = {}
            self._user_goals[goal.user_id][goal.id] = goal
            return goal

    def get_by_id(self, user_id: str, goal_id: str) -> Optional[Goal]:
        with self._lock:
            user_dict = self._user_goals.get(user_id, {})
            return user_dict.get(goal_id)

    def get_all_by_user(self, user_id: str, status: Optional[str] = None) -> list[Goal]:
        with self._lock:
            user_dict = self._user_goals.get(user_id, {})
            goals = list(user_dict.values())
            if status:
                goals = [g for g in goals if g.status.lower() == status.lower()]
            # Sort newest first
            return sorted(goals, key=lambda g: g.created_at, reverse=True)

    def update(self, user_id: str, goal_id: str, **kwargs) -> Optional[Goal]:
        with self._lock:
            user_dict = self._user_goals.get(user_id, {})
            goal = user_dict.get(goal_id)
            if not goal:
                return None
            for key, val in kwargs.items():
                if val is not None and hasattr(goal, key):
                    setattr(goal, key, val)
            goal.updated_at = datetime.utcnow()
            return goal

    def delete(self, user_id: str, goal_id: str) -> bool:
        with self._lock:
            user_dict = self._user_goals.get(user_id, {})
            if goal_id in user_dict:
                del user_dict[goal_id]
                return True
            return False


class InMemoryJournalRepository(AbstractJournalRepository):
    def __init__(self):
        self._lock = threading.Lock()
        # Keyed by user_id -> dict of journal_id -> JournalEntry
        self._user_journals: dict[str, dict[str, JournalEntry]] = {}

    def create(self, journal: JournalEntry) -> JournalEntry:
        with self._lock:
            if journal.user_id not in self._user_journals:
                self._user_journals[journal.user_id] = {}
            self._user_journals[journal.user_id][journal.id] = journal
            return journal

    def get_by_id(self, user_id: str, journal_id: str) -> Optional[JournalEntry]:
        with self._lock:
            user_dict = self._user_journals.get(user_id, {})
            return user_dict.get(journal_id)

    def get_all_by_user(self, user_id: str) -> list[JournalEntry]:
        with self._lock:
            user_dict = self._user_journals.get(user_id, {})
            journals = list(user_dict.values())
            # Return newest entries first
            return sorted(journals, key=lambda j: j.created_at, reverse=True)

    def update(self, user_id: str, journal_id: str, content: str) -> Optional[JournalEntry]:
        with self._lock:
            user_dict = self._user_journals.get(user_id, {})
            journal = user_dict.get(journal_id)
            if not journal:
                return None
            journal.content = content
            journal.updated_at = datetime.utcnow()
            return journal

    def delete(self, user_id: str, journal_id: str) -> bool:
        with self._lock:
            user_dict = self._user_journals.get(user_id, {})
            if journal_id in user_dict:
                del user_dict[journal_id]
                return True
            return False


class InMemorySummaryRepository(AbstractSummaryRepository):
    def __init__(self):
        self._lock = threading.Lock()
        # Keyed by user_id -> latest WeeklySummary
        self._user_summaries: dict[str, WeeklySummary] = {}

    def save(self, summary: WeeklySummary) -> WeeklySummary:
        with self._lock:
            self._user_summaries[summary.user_id] = summary
            return summary

    def get_latest_by_user(self, user_id: str) -> Optional[WeeklySummary]:
        with self._lock:
            return self._user_summaries.get(user_id)

# Singleton instances for in-memory persistence across routes
user_repo = InMemoryUserRepository()
goal_repo = InMemoryGoalRepository()
journal_repo = InMemoryJournalRepository()
summary_repo = InMemorySummaryRepository()
