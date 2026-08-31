"""add source and ai analysis to journals

Revision ID: eff0fe2ae701
Revises: 7c7b27cc932a
Create Date: 2026-08-20 20:04:54.692992

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'eff0fe2ae701'
down_revision: Union[str, Sequence[str], None] = '7c7b27cc932a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "journals",
        sa.Column(
            "source",
            sa.String(),
            nullable=False,
            server_default="text"
        )
    )

    op.add_column(
        "journals",
        sa.Column(
            "ai_analysis",
            sa.JSON(),
            nullable=True
        )
    )


def downgrade() -> None:
    op.drop_column("journals", "ai_analysis")
    op.drop_column("journals", "source")
