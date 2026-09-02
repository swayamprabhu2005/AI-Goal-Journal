from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    ForeignKey,
    JSON,
)

from app.database.connection import Base


class UserORM(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    firebase_uid = Column(
        String,
        unique=True,
        nullable=False,
        index=True
    )

    email = Column(
        String,
        unique=True,
        nullable=False
    )

    display_name = Column(String, nullable=True)
    profession = Column(String, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class JournalORM(Base):
    __tablename__ = "journals"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(String, nullable=True)

    content = Column(
        Text,
        nullable=False
    )

    source = Column(
        String,
        nullable=False,
        default="text"
    )

    ai_analysis = Column(
        JSON,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class GoalORM(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    category = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        nullable=False,
        default="Active"
    )

    target_date = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class ProgressORM(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)

    goal_id = Column(
        Integer,
        ForeignKey("goals.id"),
        nullable=False
    )

    progress_value = Column(
        Integer,
        nullable=False,
        default=0
    )

    note = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class AISummaryORM(Base):
    __tablename__ = "ai_summaries"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    headline = Column(
        String,
        nullable=False
    )

    wins = Column(
        JSON,
        nullable=False,
        default=list
    )

    recurring_blockers = Column(
        JSON,
        nullable=False,
        default=list
    )

    goal_status_changes = Column(
        JSON,
        nullable=False,
        default=list
    )

    mood_trend = Column(
        String,
        nullable=False,
        default="stable"
    )

    coaching_suggestion = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


class HabitORM(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    name = Column(
        String,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    frequency = Column(
        String,
        nullable=False,
        default="daily"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )


class HabitLogORM(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)

    habit_id = Column(
        Integer,
        ForeignKey("habits.id", ondelete="CASCADE"),
        nullable=False
    )

    completed_date = Column(
        DateTime,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )