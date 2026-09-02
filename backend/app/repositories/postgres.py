from datetime import datetime, timedelta
from typing import Optional

from app.database.connection import SessionLocal
from app.database.orm_models import (
    UserORM,
    JournalORM,
    GoalORM,
    ProgressORM,
    AISummaryORM,
    HabitORM,
    HabitLogORM,
)
from app.models.domain import (
    User,
    JournalEntry,
    Goal,
    Progress,
    WeeklySummary,
    Habit,
    HabitLog,
)
from app.repositories.base import (
    AbstractUserRepository,
    AbstractJournalRepository,
    AbstractGoalRepository,
    AbstractProgressRepository,
    AbstractSummaryRepository,
    AbstractHabitRepository,
)

class PostgresUserRepository(AbstractUserRepository):

    def _to_domain(self, row: UserORM) -> User:
        return User(
            firebase_uid=row.firebase_uid,
            email=row.email,
            display_name=row.display_name,
            profession=row.profession,
            created_at=row.created_at,
            # Existing PostgreSQL users table has no updated_at column yet.
            updated_at=row.created_at,
        )

    def get_or_create(
        self,
        uid: str,
        email: str,
        name: Optional[str] = None
    ) -> User:

        db = SessionLocal()

        try:
            user = (
                db.query(UserORM)
                .filter(UserORM.firebase_uid == uid)
                .first()
            )

            if user:
                # Fill missing profile information when Firebase provides it.
                changed = False

                if email and user.email != email:
                    existing_email_user = db.query(UserORM).filter(UserORM.email == email, UserORM.id != user.id).first()
                    if not existing_email_user:
                        user.email = email
                        changed = True

                if name and not user.display_name:
                    user.display_name = name
                    changed = True

                if changed:
                    db.commit()
                    db.refresh(user)

                return self._to_domain(user)

            user = UserORM(
                firebase_uid=uid,
                email=email,
                display_name=name,
                profession=None,
                created_at=datetime.utcnow(),
            )

            db.add(user)
            db.commit()
            db.refresh(user)

            return self._to_domain(user)

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def get_by_uid(
        self,
        uid: str
    ) -> Optional[User]:

        db = SessionLocal()

        try:
            user = (
                db.query(UserORM)
                .filter(UserORM.firebase_uid == uid)
                .first()
            )

            if not user:
                return None

            return self._to_domain(user)

        finally:
            db.close()

    def update_profile(
        self,
        uid: str,
        display_name: Optional[str] = None,
        profession: Optional[str] = None
    ) -> Optional[User]:

        db = SessionLocal()

        try:
            user = (
                db.query(UserORM)
                .filter(UserORM.firebase_uid == uid)
                .first()
            )

            if not user:
                return None

            if display_name is not None:
                user.display_name = display_name

            if profession is not None:
                user.profession = profession

            db.commit()
            db.refresh(user)

            return self._to_domain(user)

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()
class PostgresJournalRepository(AbstractJournalRepository):

    def _get_internal_user_id(self, db, firebase_uid: str) -> Optional[int]:
        user = (
            db.query(UserORM)
            .filter(UserORM.firebase_uid == firebase_uid)
            .first()
        )
        if not user:
            try:
                email_val = firebase_uid if "@" in firebase_uid else f"{firebase_uid}@example.com"
                user = UserORM(
                    firebase_uid=firebase_uid,
                    email=email_val,
                    display_name=firebase_uid.split("@")[0],
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                user = (
                    db.query(UserORM)
                    .filter(UserORM.firebase_uid == firebase_uid)
                    .first()
                )
        return user.id if user else None

    def create(self, journal: JournalEntry) -> JournalEntry:
        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                journal.user_id
            )

            if internal_user_id is None:
                email_val = journal.user_id if "@" in journal.user_id else f"{journal.user_id}@example.com"
                user_row = UserORM(
                    firebase_uid=journal.user_id,
                    email=email_val,
                    display_name=journal.user_id.split("@")[0],
                )
                db.add(user_row)
                db.commit()
                db.refresh(user_row)
                internal_user_id = user_row.id

            db_journal = JournalORM(
                user_id=internal_user_id,
                content=journal.content,
                source=journal.source,
                title=journal.title,
                ai_analysis=journal.ai_analysis,
                created_at=journal.created_at,
                updated_at=journal.updated_at,
            )

            db.add(db_journal)
            db.commit()
            db.refresh(db_journal)

            return JournalEntry(
                id=str(db_journal.id),
                user_id=journal.user_id,
                content=db_journal.content,
                source=db_journal.source,
                title=db_journal.title,
                ai_analysis=db_journal.ai_analysis,
                created_at=db_journal.created_at,
                updated_at=db_journal.updated_at,
            )

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def get_by_id(
        self,
        user_id: str,
        journal_id: str
    ) -> Optional[JournalEntry]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return None

            try:
                db_journal_id = int(journal_id)
            except ValueError:
                return None

            db_journal = (
                db.query(JournalORM)
                .filter(
                    JournalORM.id == db_journal_id,
                    JournalORM.user_id == internal_user_id
                )
                .first()
            )

            if not db_journal:
                return None

            return JournalEntry(
                id=str(db_journal.id),
                user_id=user_id,
                content=db_journal.content,
                source=db_journal.source or "text",
                title=db_journal.title,
                ai_analysis=db_journal.ai_analysis,
                created_at=db_journal.created_at,
                updated_at=db_journal.updated_at,
            )

        finally:
            db.close()

    def get_all_by_user(
        self,
        user_id: str
    ) -> list[JournalEntry]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return []

            rows = (
                db.query(JournalORM)
                .filter(
                    JournalORM.user_id == internal_user_id
                )
                .order_by(
                    JournalORM.created_at.desc()
                )
                .all()
            )

            return [
                JournalEntry(
                    id=str(row.id),
                    user_id=user_id,
                    content=row.content,
                    source=row.source or "text",
                    title=row.title,
                    ai_analysis=row.ai_analysis,
                    created_at=row.created_at,
                    updated_at=row.updated_at,
                )
                for row in rows
            ]

        finally:
            db.close()

    def update(
        self,
        user_id: str,
        journal_id: str,
        content: str
    ) -> Optional[JournalEntry]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return None

            try:
                db_journal_id = int(journal_id)
            except ValueError:
                return None

            db_journal = (
                db.query(JournalORM)
                .filter(
                    JournalORM.id == db_journal_id,
                    JournalORM.user_id == internal_user_id
                )
                .first()
            )

            if not db_journal:
                return None

            db_journal.content = content
            db_journal.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(db_journal)

            return JournalEntry(
                id=str(db_journal.id),
                user_id=user_id,
                content=db_journal.content,
                source=db_journal.source or "text",
                title=db_journal.title,
                ai_analysis=db_journal.ai_analysis,
                created_at=db_journal.created_at,
                updated_at=db_journal.updated_at,
            )

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def delete(
        self,
        user_id: str,
        journal_id: str
    ) -> bool:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return False

            try:
                db_journal_id = int(journal_id)
            except ValueError:
                return False

            db_journal = (
                db.query(JournalORM)
                .filter(
                    JournalORM.id == db_journal_id,
                    JournalORM.user_id == internal_user_id
                )
                .first()
            )

            if not db_journal:
                return False

            db.delete(db_journal)
            db.commit()

            return True

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

class PostgresGoalRepository(AbstractGoalRepository):

    def _get_internal_user_id(
        self,
        db,
        firebase_uid: str
    ) -> Optional[int]:

        user = (
            db.query(UserORM)
            .filter(UserORM.firebase_uid == firebase_uid)
            .first()
        )
        if not user:
            try:
                email_val = firebase_uid if "@" in firebase_uid else f"{firebase_uid}@example.com"
                user = UserORM(
                    firebase_uid=firebase_uid,
                    email=email_val,
                    display_name=firebase_uid.split("@")[0],
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                user = (
                    db.query(UserORM)
                    .filter(UserORM.firebase_uid == firebase_uid)
                    .first()
                )

        return user.id if user else None

    def _to_domain(
        self,
        row: GoalORM,
        firebase_uid: str
    ) -> Goal:

        return Goal(
            id=str(row.id),
            user_id=firebase_uid,
            title=row.title,
            description=row.description,
            category=row.category,
            status=row.status,
            target_date=row.target_date,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def create(self, goal: Goal) -> Goal:
        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                goal.user_id
            )

            if internal_user_id is None:
                email_val = goal.user_id if "@" in goal.user_id else f"{goal.user_id}@example.com"
                user_row = UserORM(
                    firebase_uid=goal.user_id,
                    email=email_val,
                    display_name=goal.user_id.split("@")[0],
                )
                db.add(user_row)
                db.commit()
                db.refresh(user_row)
                internal_user_id = user_row.id

            db_goal = GoalORM(
                user_id=internal_user_id,
                title=goal.title,
                description=goal.description,
                category=goal.category,
                status=goal.status,
                target_date=goal.target_date,
                created_at=goal.created_at,
                updated_at=goal.updated_at,
            )

            db.add(db_goal)
            db.commit()
            db.refresh(db_goal)

            return self._to_domain(
                db_goal,
                goal.user_id
            )

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def get_by_id(
        self,
        user_id: str,
        goal_id: str
    ) -> Optional[Goal]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return None

            try:
                db_goal_id = int(goal_id)
            except ValueError:
                return None

            row = (
                db.query(GoalORM)
                .filter(
                    GoalORM.id == db_goal_id,
                    GoalORM.user_id == internal_user_id
                )
                .first()
            )

            if not row:
                return None

            return self._to_domain(row, user_id)

        finally:
            db.close()

    def get_all_by_user(
        self,
        user_id: str,
        status: Optional[str] = None
    ) -> list[Goal]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return []

            query = db.query(GoalORM).filter(
                GoalORM.user_id == internal_user_id
            )

            if status:
                query = query.filter(
                    GoalORM.status.ilike(status)
                )

            rows = query.order_by(
                GoalORM.created_at.desc()
            ).all()

            return [
                self._to_domain(row, user_id)
                for row in rows
            ]

        finally:
            db.close()

    def update(
        self,
        user_id: str,
        goal_id: str,
        **kwargs
    ) -> Optional[Goal]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return None

            try:
                db_goal_id = int(goal_id)
            except ValueError:
                return None

            row = (
                db.query(GoalORM)
                .filter(
                    GoalORM.id == db_goal_id,
                    GoalORM.user_id == internal_user_id
                )
                .first()
            )

            if not row:
                return None

            allowed_fields = {
                "title",
                "description",
                "category",
                "status",
                "target_date",
            }

            for key, value in kwargs.items():
                if key in allowed_fields and value is not None:
                    setattr(row, key, value)

            row.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(row)

            return self._to_domain(row, user_id)

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def delete(
        self,
        user_id: str,
        goal_id: str
    ) -> bool:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return False

            try:
                db_goal_id = int(goal_id)
            except ValueError:
                return False

            row = (
                db.query(GoalORM)
                .filter(
                    GoalORM.id == db_goal_id,
                    GoalORM.user_id == internal_user_id
                )
                .first()
            )

            if not row:
                return False

            db.delete(row)
            db.commit()

            return True

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()            

class PostgresProgressRepository(AbstractProgressRepository):

    def _get_internal_user_id(
        self,
        db,
        firebase_uid: str
    ) -> Optional[int]:

        user = (
            db.query(UserORM)
            .filter(UserORM.firebase_uid == firebase_uid)
            .first()
        )
        if not user:
            try:
                email_val = firebase_uid if "@" in firebase_uid else f"{firebase_uid}@example.com"
                user = UserORM(
                    firebase_uid=firebase_uid,
                    email=email_val,
                    display_name=firebase_uid.split("@")[0],
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                user = (
                    db.query(UserORM)
                    .filter(UserORM.firebase_uid == firebase_uid)
                    .first()
                )

        return user.id if user else None

    def _to_domain(self, row: ProgressORM) -> Progress:
        return Progress(
            id=str(row.id),
            goal_id=str(row.goal_id),
            progress_value=row.progress_value,
            note=row.note,
            created_at=row.created_at,
        )

    def _get_owned_goal(
        self,
        db,
        firebase_uid: str,
        goal_id: str
    ) -> Optional[GoalORM]:

        internal_user_id = self._get_internal_user_id(
            db,
            firebase_uid
        )

        if internal_user_id is None:
            return None

        try:
            db_goal_id = int(goal_id)
        except ValueError:
            return None

        return (
            db.query(GoalORM)
            .filter(
                GoalORM.id == db_goal_id,
                GoalORM.user_id == internal_user_id
            )
            .first()
        )

    def create(self, progress: Progress) -> Progress:
        db = SessionLocal()

        try:
            # progress.goal_id must already refer to a persisted goal
            try:
                db_goal_id = int(progress.goal_id)
            except ValueError:
                raise ValueError("Invalid goal_id")

            db_progress = ProgressORM(
                goal_id=db_goal_id,
                progress_value=progress.progress_value,
                note=progress.note,
                created_at=progress.created_at,
            )

            db.add(db_progress)
            db.commit()
            db.refresh(db_progress)

            return self._to_domain(db_progress)

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def get_by_id(
        self,
        user_id: str,
        progress_id: str
    ) -> Optional[Progress]:

        db = SessionLocal()

        try:
            try:
                db_progress_id = int(progress_id)
            except ValueError:
                return None

            row = (
                db.query(ProgressORM)
                .join(
                    GoalORM,
                    ProgressORM.goal_id == GoalORM.id
                )
                .join(
                    UserORM,
                    GoalORM.user_id == UserORM.id
                )
                .filter(
                    ProgressORM.id == db_progress_id,
                    UserORM.firebase_uid == user_id
                )
                .first()
            )

            if not row:
                return None

            return self._to_domain(row)

        finally:
            db.close()

    def get_by_goal(
        self,
        user_id: str,
        goal_id: str
    ) -> list[Progress]:

        db = SessionLocal()

        try:
            owned_goal = self._get_owned_goal(
                db,
                user_id,
                goal_id
            )

            if not owned_goal:
                return []

            rows = (
                db.query(ProgressORM)
                .filter(
                    ProgressORM.goal_id == owned_goal.id
                )
                .order_by(
                    ProgressORM.created_at.desc()
                )
                .all()
            )

            return [
                self._to_domain(row)
                for row in rows
            ]

        finally:
            db.close()

    def get_latest_by_goal(
        self,
        user_id: str,
        goal_id: str
    ) -> Optional[Progress]:

        db = SessionLocal()

        try:
            owned_goal = self._get_owned_goal(
                db,
                user_id,
                goal_id
            )

            if not owned_goal:
                return None

            row = (
                db.query(ProgressORM)
                .filter(
                    ProgressORM.goal_id == owned_goal.id
                )
                .order_by(
                    ProgressORM.created_at.desc()
                )
                .first()
            )

            if not row:
                return None

            return self._to_domain(row)

        finally:
            db.close()


class PostgresSummaryRepository(AbstractSummaryRepository):

    def _get_internal_user_id(
        self,
        db,
        firebase_uid: str
    ) -> Optional[int]:

        user = (
            db.query(UserORM)
            .filter(UserORM.firebase_uid == firebase_uid)
            .first()
        )
        if not user:
            try:
                email_val = firebase_uid if "@" in firebase_uid else f"{firebase_uid}@example.com"
                user = UserORM(
                    firebase_uid=firebase_uid,
                    email=email_val,
                    display_name=firebase_uid.split("@")[0],
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            except Exception:
                db.rollback()
                user = (
                    db.query(UserORM)
                    .filter(UserORM.firebase_uid == firebase_uid)
                    .first()
                )

        return user.id if user else None

    def _to_domain(
        self,
        row: AISummaryORM,
        firebase_uid: str
    ) -> WeeklySummary:

        return WeeklySummary(
            id=str(row.id),
            user_id=firebase_uid,
            headline=row.headline,
            wins=row.wins or [],
            recurring_blockers=row.recurring_blockers or [],
            goal_status_changes=row.goal_status_changes or [],
            mood_trend=row.mood_trend or "stable",
            coaching_suggestion=row.coaching_suggestion or "",
            created_at=row.created_at,
        )

    def save(
        self,
        summary: WeeklySummary
    ) -> WeeklySummary:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                summary.user_id
            )

            if internal_user_id is None:
                email_val = summary.user_id if "@" in summary.user_id else f"{summary.user_id}@example.com"
                user_row = UserORM(
                    firebase_uid=summary.user_id,
                    email=email_val,
                    display_name=summary.user_id.split("@")[0],
                )
                db.add(user_row)
                db.commit()
                db.refresh(user_row)
                internal_user_id = user_row.id

            db_summary = AISummaryORM(
                user_id=internal_user_id,
                headline=summary.headline,
                wins=summary.wins,
                recurring_blockers=summary.recurring_blockers,
                goal_status_changes=summary.goal_status_changes,
                mood_trend=summary.mood_trend,
                coaching_suggestion=summary.coaching_suggestion,
                created_at=summary.created_at,
            )

            db.add(db_summary)
            db.commit()
            db.refresh(db_summary)

            return self._to_domain(
                db_summary,
                summary.user_id
            )

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def get_latest_by_user(
        self,
        user_id: str
    ) -> Optional[WeeklySummary]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return None

            row = (
                db.query(AISummaryORM)
                .filter(
                    AISummaryORM.user_id == internal_user_id
                )
                .order_by(
                    AISummaryORM.created_at.desc()
                )
                .first()
            )

            if not row:
                return None

            return self._to_domain(
                row,
                user_id
            )

        finally:
            db.close()    

class PostgresHabitRepository(AbstractHabitRepository):

    def _get_internal_user_id(
        self,
        db,
        firebase_uid: str
    ) -> Optional[int]:

        user = (
            db.query(UserORM)
            .filter(UserORM.firebase_uid == firebase_uid)
            .first()
        )

        return user.id if user else None

    def _to_domain(
        self,
        row: HabitORM,
        firebase_uid: str
    ) -> Habit:

        return Habit(
            id=str(row.id),
            user_id=firebase_uid,
            name=row.name,
            description=row.description,
            frequency=row.frequency,
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def _log_to_domain(
        self,
        row: HabitLogORM
    ) -> HabitLog:

        return HabitLog(
            id=str(row.id),
            habit_id=str(row.habit_id),
            completed_date=row.completed_date,
            created_at=row.created_at,
        )

    def _get_owned_habit(
        self,
        db,
        user_id: str,
        habit_id: str
    ) -> Optional[HabitORM]:

        internal_user_id = self._get_internal_user_id(
            db,
            user_id
        )

        if internal_user_id is None:
            return None

        try:
            db_habit_id = int(habit_id)
        except ValueError:
            return None

        return (
            db.query(HabitORM)
            .filter(
                HabitORM.id == db_habit_id,
                HabitORM.user_id == internal_user_id
            )
            .first()
        )

    def create(
        self,
        habit: Habit
    ) -> Habit:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                habit.user_id
            )

            if internal_user_id is None:
                raise LookupError(
                    "Authenticated user does not exist in PostgreSQL"
                )

            row = HabitORM(
                user_id=internal_user_id,
                name=habit.name,
                description=habit.description,
                frequency=habit.frequency,
                created_at=habit.created_at,
                updated_at=habit.updated_at,
            )

            db.add(row)
            db.commit()
            db.refresh(row)

            return self._to_domain(
                row,
                habit.user_id
            )

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def get_by_id(
        self,
        user_id: str,
        habit_id: str
    ) -> Optional[Habit]:

        db = SessionLocal()

        try:
            row = self._get_owned_habit(
                db,
                user_id,
                habit_id
            )

            if not row:
                return None

            return self._to_domain(row, user_id)

        finally:
            db.close()

    def get_all_by_user(
        self,
        user_id: str
    ) -> list[Habit]:

        db = SessionLocal()

        try:
            internal_user_id = self._get_internal_user_id(
                db,
                user_id
            )

            if internal_user_id is None:
                return []

            rows = (
                db.query(HabitORM)
                .filter(
                    HabitORM.user_id == internal_user_id
                )
                .order_by(
                    HabitORM.created_at.desc()
                )
                .all()
            )

            return [
                self._to_domain(row, user_id)
                for row in rows
            ]

        finally:
            db.close()

    def update(
        self,
        user_id: str,
        habit_id: str,
        **kwargs
    ) -> Optional[Habit]:

        db = SessionLocal()

        try:
            row = self._get_owned_habit(
                db,
                user_id,
                habit_id
            )

            if not row:
                return None

            allowed_fields = {
                "name",
                "description",
                "frequency",
            }

            for key, value in kwargs.items():
                if key in allowed_fields and value is not None:
                    setattr(row, key, value)

            row.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(row)

            return self._to_domain(row, user_id)

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def delete(
        self,
        user_id: str,
        habit_id: str
    ) -> bool:

        db = SessionLocal()

        try:
            row = self._get_owned_habit(
                db,
                user_id,
                habit_id
            )

            if not row:
                return False

            db.delete(row)
            db.commit()

            return True

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def add_log(
        self,
        user_id: str,
        habit_id: str,
        completed_date: datetime
    ) -> Optional[HabitLog]:

        db = SessionLocal()

        try:
            habit = self._get_owned_habit(
                db,
                user_id,
                habit_id
            )

            if not habit:
                return None

            day_start = completed_date.replace(
                hour=0,
                minute=0,
                second=0,
                microsecond=0
            )

            day_end = day_start + timedelta(days=1)

            existing = (
                db.query(HabitLogORM)
                .filter(
                    HabitLogORM.habit_id == habit.id,
                    HabitLogORM.completed_date >= day_start,
                    HabitLogORM.completed_date < day_end
                )
                .first()
            )

            if existing:
                return self._log_to_domain(existing)

            row = HabitLogORM(
                habit_id=habit.id,
                completed_date=completed_date,
                created_at=datetime.utcnow(),
            )

            db.add(row)
            db.commit()
            db.refresh(row)

            return self._log_to_domain(row)

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def remove_log(
        self,
        user_id: str,
        habit_id: str,
        completed_date: datetime
    ) -> bool:

        db = SessionLocal()

        try:
            habit = self._get_owned_habit(
                db,
                user_id,
                habit_id
            )

            if not habit:
                return False

            day_start = completed_date.replace(
                hour=0,
                minute=0,
                second=0,
                microsecond=0
            )

            day_end = day_start + timedelta(days=1)

            row = (
                db.query(HabitLogORM)
                .filter(
                    HabitLogORM.habit_id == habit.id,
                    HabitLogORM.completed_date >= day_start,
                    HabitLogORM.completed_date < day_end
                )
                .first()
            )

            if not row:
                return False

            db.delete(row)
            db.commit()

            return True

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

    def get_logs(
        self,
        user_id: str,
        habit_id: str
    ) -> list[HabitLog]:

        db = SessionLocal()

        try:
            habit = self._get_owned_habit(
                db,
                user_id,
                habit_id
            )

            if not habit:
                return []

            rows = (
                db.query(HabitLogORM)
                .filter(
                    HabitLogORM.habit_id == habit.id
                )
                .order_by(
                    HabitLogORM.completed_date.desc()
                )
                .all()
            )

            return [
                self._log_to_domain(row)
                for row in rows
            ]

        finally:
            db.close()
                    
user_repo = PostgresUserRepository()
journal_repo = PostgresJournalRepository()
goal_repo = PostgresGoalRepository()
progress_repo = PostgresProgressRepository()
summary_repo = PostgresSummaryRepository()
habit_repo = PostgresHabitRepository()