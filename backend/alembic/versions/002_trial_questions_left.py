"""Add trial_questions_left: new users get 3 free questions.

Revision ID: 002_trial_questions_left
Revises: 001_custom_auth
Create Date: 2025-03-14

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '002_trial_questions_left'
down_revision: Union[str, None] = '001_custom_auth'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('trial_questions_left', sa.Integer(), server_default='3', nullable=True),
    )
    # Backfill: existing users who had 1 trial keep 1; others 0
    op.execute(
        "UPDATE users SET trial_questions_left = CASE WHEN trial_question_flg = true THEN 1 ELSE 0 END"
    )
    op.alter_column(
        'users', 'trial_questions_left',
        existing_type=sa.Integer(),
        server_default='3',
        nullable=False,
    )


def downgrade() -> None:
    op.drop_column('users', 'trial_questions_left')
