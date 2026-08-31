"""add category and target date to goals

Revision ID: dc93a6582515
Revises: 583e9d81267d
Create Date: 2026-08-20 23:29:22.506773

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc93a6582515'
down_revision: Union[str, Sequence[str], None] = 'eff0fe2ae701'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column(
        "goals",
        sa.Column("category", sa.String(), nullable=True)
    )

    op.add_column(
        "goals",
        sa.Column("target_date", sa.String(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("goals", "target_date")
    op.drop_column("goals", "category")