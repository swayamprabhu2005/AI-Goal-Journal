import threading
import uuid
from datetime import datetime
from typing import Optional, Any
from app.models.domain import User, Goal, JournalEntry, WeeklySummary, Progress, Habit, HabitLog
from app.repositories.base import (
    AbstractUserRepository,
    AbstractGoalRepository,
    AbstractJournalRepository,
    AbstractSummaryRepository,
    AbstractProgressRepository,
    AbstractHabitRepository,
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
        self, uid: str, display_name: Optional[str] = None, profession: Optional[str] = None, preferences: Optional[dict[str, Any]] = None
    ) -> Optional[User]:
        with self._lock:
            user = self._users.get(uid)
            if not user:
                return None
            if display_name is not None:
                user.display_name = display_name
            if profession is not None:
                user.profession = profession
            if preferences is not None:
                user.preferences = {**user.preferences, **preferences}
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


class InMemoryProgressRepository(AbstractProgressRepository):
    def __init__(self):
        self._lock = threading.Lock()

        # Keyed by goal_id -> list of Progress records
        self._goal_progress: dict[str, list[Progress]] = {}

    def create(self, progress: Progress) -> Progress:
        with self._lock:
            if progress.goal_id not in self._goal_progress:
                self._goal_progress[progress.goal_id] = []

            self._goal_progress[progress.goal_id].append(progress)
            return progress

    def get_by_id(
        self,
        user_id: str,
        progress_id: str
    ) -> Optional[Progress]:
        """
        Return a single progress record by ID.

        user_id is accepted to match the repository interface.
        Ownership is checked by the service through the user's goal.
        """
        with self._lock:
            for history in self._goal_progress.values():
                for progress in history:
                    if progress.id == progress_id:
                        return progress

            return None

    def get_by_goal(
        self,
        user_id: str,
        goal_id: str
    ) -> list[Progress]:
        """
        Return all progress records for a goal,
        newest first.
        """
        with self._lock:
            history = self._goal_progress.get(goal_id, [])

            return sorted(
                history,
                key=lambda p: p.created_at,
                reverse=True
            )

    def get_latest_by_goal(
        self,
        user_id: str,
        goal_id: str
    ) -> Optional[Progress]:
        """
        Return the latest progress record for a goal.
        """
        with self._lock:
            history = self._goal_progress.get(goal_id, [])

            if not history:
                return None

            return max(
                history,
                key=lambda p: p.created_at
            )

    # Compatibility helper for older code/tests.
    def get_all_by_goal(
        self,
        goal_id: str
    ) -> list[Progress]:
        with self._lock:
            history = self._goal_progress.get(goal_id, [])

            return sorted(
                history,
                key=lambda p: p.created_at,
                reverse=True
            )

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


class InMemoryHabitRepository(AbstractHabitRepository):
    def __init__(self):
        self._lock = threading.Lock()
        # Keyed by user_id -> dict of habit_id -> Habit
        self._user_habits: dict[str, dict[str, Habit]] = {}
        # Keyed by user_id -> dict of habit_id -> list[HabitLog]
        self._user_logs: dict[str, dict[str, list[HabitLog]]] = {}

    def create(self, habit: Habit) -> Habit:
        with self._lock:
            if habit.user_id not in self._user_habits:
                self._user_habits[habit.user_id] = {}
                self._user_logs[habit.user_id] = {}
            self._user_habits[habit.user_id][habit.id] = habit
            if habit.id not in self._user_logs[habit.user_id]:
                self._user_logs[habit.user_id][habit.id] = []
            return habit

    def get_by_id(self, user_id: str, habit_id: str) -> Optional[Habit]:
        with self._lock:
            user_dict = self._user_habits.get(user_id, {})
            return user_dict.get(habit_id)

    def get_all_by_user(self, user_id: str) -> list[Habit]:
        with self._lock:
            user_dict = self._user_habits.get(user_id, {})
            habits = list(user_dict.values())
            return sorted(habits, key=lambda h: h.created_at, reverse=True)

    def update(self, user_id: str, habit_id: str, **kwargs) -> Optional[Habit]:
        with self._lock:
            user_dict = self._user_habits.get(user_id, {})
            habit = user_dict.get(habit_id)
            if not habit:
                return None
            for key, val in kwargs.items():
                if val is not None and hasattr(habit, key):
                    setattr(habit, key, val)
            habit.updated_at = datetime.utcnow()
            return habit

    def delete(self, user_id: str, habit_id: str) -> bool:
        with self._lock:
            user_dict = self._user_habits.get(user_id, {})
            if habit_id in user_dict:
                del user_dict[habit_id]
                if user_id in self._user_logs and habit_id in self._user_logs[user_id]:
                    del self._user_logs[user_id][habit_id]
                return True
            return False

    def add_log(self, user_id: str, habit_id: str, completed_date: datetime) -> Optional[HabitLog]:
        with self._lock:
            user_dict = self._user_habits.get(user_id, {})
            if habit_id not in user_dict:
                return None
            if user_id not in self._user_logs:
                self._user_logs[user_id] = {}
            if habit_id not in self._user_logs[user_id]:
                self._user_logs[user_id][habit_id] = []

            # Match on date part so time components do not prevent matching
            day_target = completed_date.date()
            for log in self._user_logs[user_id][habit_id]:
                if log.completed_date.date() == day_target:
                    return log

            log = HabitLog(
                id=str(uuid.uuid4()),
                habit_id=habit_id,
                completed_date=completed_date,
                created_at=datetime.utcnow(),
            )
            self._user_logs[user_id][habit_id].append(log)
            return log

    def remove_log(self, user_id: str, habit_id: str, completed_date: datetime) -> bool:
        with self._lock:
            user_dict = self._user_habits.get(user_id, {})
            if habit_id not in user_dict:
                return False
            logs = self._user_logs.get(user_id, {}).get(habit_id, [])
            day_target = completed_date.date()
            initial_len = len(logs)
            self._user_logs[user_id][habit_id] = [
                log for log in logs if log.completed_date.date() != day_target
            ]
            return len(self._user_logs[user_id][habit_id]) < initial_len

    def get_logs(self, user_id: str, habit_id: str) -> list[HabitLog]:
        with self._lock:
            return list(self._user_logs.get(user_id, {}).get(habit_id, []))


# Singleton instances for in-memory persistence across routes
user_repo = InMemoryUserRepository()
goal_repo = InMemoryGoalRepository()
journal_repo = InMemoryJournalRepository()
summary_repo = InMemorySummaryRepository()
progress_repo = InMemoryProgressRepository()
habit_repo = InMemoryHabitRepository()

