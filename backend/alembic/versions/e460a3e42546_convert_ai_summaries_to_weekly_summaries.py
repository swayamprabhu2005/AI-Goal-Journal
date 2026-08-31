"""convert ai summaries to weekly summaries

Revision ID: e460a3e42546
Revises: dc93a6582515
Create Date: 2026-08-29
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "e460a3e42546"
down_revision: Union[str, Sequence[str], None] = "dc93a6582515"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove the old per-journal AI summary table.
    op.drop_table("ai_summaries")

    # Recreate ai_summaries for weekly accountability summaries.
    op.create_table(
        "ai_summaries",

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
            "headline",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "wins",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False
        ),

        sa.Column(
            "recurring_blockers",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False
        ),

        sa.Column(
            "goal_status_changes",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False
        ),

        sa.Column(
            "mood_trend",
            sa.String(),
            nullable=False
        ),

        sa.Column(
            "coaching_suggestion",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "created_at",
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
        op.f("ix_ai_summaries_id"),
        "ai_summaries",
        ["id"],
        unique=False
    )


def downgrade() -> None:
    # Remove the weekly summary version.
    op.drop_table("ai_summaries")

    # Restore the previous per-journal AI summary structure.
    op.create_table(
        "ai_summaries",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "journal_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "summary",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "insights",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "blockers",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "activities",
            sa.Text(),
            nullable=True
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=True
        ),

        sa.ForeignKeyConstraint(
            ["journal_id"],
            ["journals.id"]
        ),

        sa.PrimaryKeyConstraint("id")
    )

    op.create_index(
        op.f("ix_ai_summaries_id"),
        "ai_summaries",
        ["id"],
        unique=False
    )