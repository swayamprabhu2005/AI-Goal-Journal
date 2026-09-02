"""create habits and habit logs tables

Revision ID: 18fd7b136284
Revises: e460a3e42546
Create Date: 2026-08-31 18:53:59.358407

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '18fd7b136284'
down_revision: Union[str, Sequence[str], None] = 'e460a3e42546'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "habits",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "name",
            sa.String(),
            nullable=False
        ),
        sa.Column(
            "description",
            sa.Text(),
            nullable=True
        ),
        sa.Column(
            "frequency",
            sa.String(),
            nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"]
        ),
        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        op.f("ix_habits_id"),
        "habits",
        ["id"],
        unique=False
    )

    op.create_table(
        "habit_logs",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "habit_id",
            sa.Integer(),
            nullable=False
        ),
        sa.Column(
            "completed_date",
            sa.DateTime(),
            nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True
        ),
        sa.ForeignKeyConstraint(
            ["habit_id"],
            ["habits.id"],
            ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        op.f("ix_habit_logs_id"),
        "habit_logs",
        ["id"],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_habit_logs_id"),
        table_name="habit_logs"
    )
    op.drop_table("habit_logs")

    op.drop_index(
        op.f("ix_habits_id"),
        table_name="habits"
    )
    op.drop_table("habits")