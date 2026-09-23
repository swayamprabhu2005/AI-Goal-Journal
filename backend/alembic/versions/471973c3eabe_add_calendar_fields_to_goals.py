"""add calendar fields to goals

Revision ID: 471973c3eabe
Revises: 18fd7b136284
Create Date: 2026-09-16 22:05:28.768795

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '471973c3eabe'
down_revision: Union[str, Sequence[str], None] = '18fd7b136284'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "goals",
        sa.Column("google_event_id", sa.String(length=255), nullable=True)
    )

    op.add_column(
        "goals",
        sa.Column("google_event_link", sa.Text(), nullable=True)
    )

    op.add_column(
        "goals",
        sa.Column(
            "calendar_synced",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )


def downgrade() -> None:
    op.drop_column("goals", "calendar_synced")
    op.drop_column("goals", "google_event_link")
    op.drop_column("goals", "google_event_id")
