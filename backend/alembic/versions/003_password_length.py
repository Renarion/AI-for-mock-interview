"""Store password length at registration (no plaintext).

Revision ID: 003_password_length
Revises: 002_trial_questions_left
Create Date: 2026-03-21

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '003_password_length'
down_revision: Union[str, None] = '002_trial_questions_left'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('password_length', sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'password_length')
