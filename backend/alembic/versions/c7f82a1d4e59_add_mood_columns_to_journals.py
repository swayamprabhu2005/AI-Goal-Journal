"""add mood and reflection columns to journals

Revision ID: c7f82a1d4e59
Revises: b9821d3f56e1
Create Date: 2026-09-23 19:35:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7f82a1d4e59'
down_revision: Union[str, Sequence[str], None] = 'b9821d3f56e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Safely add columns if they don't already exist
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [c['name'] for c in inspector.get_columns('journals')]

    if 'detected_mood' not in existing_columns:
        op.add_column(
            'journals',
            sa.Column('detected_mood', sa.String(length=100), nullable=True)
        )

    if 'mood_confidence' not in existing_columns:
        op.add_column(
            'journals',
            sa.Column('mood_confidence', sa.Float(), nullable=True)
        )

    if 'trigger_keywords' not in existing_columns:
        op.add_column(
            'journals',
            sa.Column('trigger_keywords', sa.JSON(), nullable=True)
        )


def downgrade() -> None:
    op.drop_column('journals', 'trigger_keywords')
    op.drop_column('journals', 'mood_confidence')
    op.drop_column('journals', 'detected_mood')
