from datetime import datetime, timedelta
import uuid
from typing import Optional

from app.models.domain import Habit, HabitLog
from app.repositories.in_memory import habit_repo


class HabitService:

    def create_habit(
        self,
        user_id: str,
        name: str,
        description: Optional[str] = None,
        frequency: str = "daily"
    ) -> Habit:

        habit = Habit(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            description=description,
            frequency=frequency,
        )

        return habit_repo.create(habit)

    def get_habits(
        self,
        user_id: str
    ) -> list[Habit]:

        return habit_repo.get_all_by_user(user_id)

    def get_habit(
        self,
        user_id: str,
        habit_id: str
    ) -> Optional[Habit]:

        return habit_repo.get_by_id(
            user_id,
            habit_id
        )

    def update_habit(
        self,
        user_id: str,
        habit_id: str,
        **kwargs
    ) -> Optional[Habit]:

        return habit_repo.update(
            user_id,
            habit_id,
            **kwargs
        )

    def delete_habit(
        self,
        user_id: str,
        habit_id: str
    ) -> bool:

        return habit_repo.delete(
            user_id,
            habit_id
        )

    def complete_habit(
        self,
        user_id: str,
        habit_id: str,
        completed_date: Optional[datetime] = None
    ) -> Optional[HabitLog]:

        if completed_date is None:
            completed_date = datetime.utcnow()

        return habit_repo.add_log(
            user_id,
            habit_id,
            completed_date
        )

    def uncomplete_habit(
        self,
        user_id: str,
        habit_id: str,
        completed_date: Optional[datetime] = None
    ) -> bool:

        if completed_date is None:
            completed_date = datetime.utcnow()

        return habit_repo.remove_log(
            user_id,
            habit_id,
            completed_date
        )

    def get_logs(
        self,
        user_id: str,
        habit_id: str
    ) -> list[HabitLog]:

        return habit_repo.get_logs(
            user_id,
            habit_id
        )

    def get_current_streak(
        self,
        user_id: str,
        habit_id: str
    ) -> int:

        logs = habit_repo.get_logs(
            user_id,
            habit_id
        )

        if not logs:
            return 0

        completed_days = {
            log.completed_date.date()
            for log in logs
        }

        today = datetime.utcnow().date()

        if today in completed_days:
            current_day = today
        elif (today - timedelta(days=1)) in completed_days:
            current_day = today - timedelta(days=1)
        else:
            return 0

        streak = 0

        while current_day in completed_days:
            streak += 1
            current_day -= timedelta(days=1)

        return streak

    def is_completed_today(
        self,
        user_id: str,
        habit_id: str
    ) -> bool:

        logs = habit_repo.get_logs(
            user_id,
            habit_id
        )

        today = datetime.utcnow().date()

        return any(
            log.completed_date.date() == today
            for log in logs
        )


habit_service = HabitService()