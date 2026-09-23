"""create roadmaps table

Revision ID: b9821d3f56e1
Revises: 471973c3eabe
Create Date: 2026-09-21 20:25:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9821d3f56e1'
down_revision: Union[str, Sequence[str], None] = '471973c3eabe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'roadmaps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('goal_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('goal_title', sa.String(), nullable=False),
        sa.Column('total_milestones', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('estimated_total_duration', sa.String(), nullable=True, server_default='Self-paced'),
        sa.Column('milestones', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roadmaps_id'), 'roadmaps', ['id'], unique=False)
    op.create_index(op.f('ix_roadmaps_goal_id'), 'roadmaps', ['goal_id'], unique=False)
    op.create_index(op.f('ix_roadmaps_user_id'), 'roadmaps', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_roadmaps_user_id'), table_name='roadmaps')
    op.drop_index(op.f('ix_roadmaps_goal_id'), table_name='roadmaps')
    op.drop_index(op.f('ix_roadmaps_id'), table_name='roadmaps')
    op.drop_table('roadmaps')
