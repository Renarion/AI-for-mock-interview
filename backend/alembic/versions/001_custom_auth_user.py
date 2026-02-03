"""Custom auth: add name, email, telegram, password_hash; drop clerk_user_id.

Revision ID: 001_custom_auth
Revises:
Create Date: 2025-02-03

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '001_custom_auth'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = sa.inspect(conn)
    tables = insp.get_table_names()
    
    if 'users' not in tables:
        op.create_table(
            'users',
            sa.Column('user_id', sa.String(), primary_key=True, index=True),
            sa.Column('created_dttm', sa.DateTime(), server_default=sa.func.now()),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('telegram_username', sa.String(), nullable=True),
            sa.Column('password_hash', sa.String(), nullable=False),
            sa.Column('trial_question_flg', sa.Boolean(), server_default='true'),
            sa.Column('paid_questions_number_left', sa.Integer(), server_default='0'),
            sa.Column('os', sa.String(), nullable=True),
            sa.Column('country', sa.String(), nullable=True),
            sa.Column('city', sa.String(), nullable=True),
            sa.Column('registration_type', sa.String(), server_default='email'),
        )
        op.create_index('ix_users_email', 'users', ['email'], unique=True)
        op.create_index('ix_users_telegram_username', 'users', ['telegram_username'], unique=True)
    else:
        # Table exists (old schema with clerk_user_id) - alter
        cols = [c['name'] for c in insp.get_columns('users')]
        if 'name' not in cols:
            op.add_column('users', sa.Column('name', sa.String(), nullable=True))
        if 'email' not in cols:
            op.add_column('users', sa.Column('email', sa.String(), nullable=True))
        if 'telegram_username' not in cols:
            op.add_column('users', sa.Column('telegram_username', sa.String(), nullable=True))
        if 'password_hash' not in cols:
            op.add_column('users', sa.Column('password_hash', sa.String(), nullable=True))
        if 'clerk_user_id' in cols:
            op.drop_column('users', 'clerk_user_id')
        try:
            op.create_index('ix_users_email', 'users', ['email'], unique=True)
        except Exception:
            pass
        try:
            op.create_index('ix_users_telegram_username', 'users', ['telegram_username'], unique=True)
        except Exception:
            pass


def downgrade() -> None:
    insp = sa.inspect(op.get_bind())
    if 'users' not in insp.get_table_names():
        return
    cols = [c['name'] for c in insp.get_columns('users')]
    op.drop_index('ix_users_telegram_username', 'users', if_exists=True)
    op.drop_index('ix_users_email', 'users', if_exists=True)
    op.add_column('users', sa.Column('clerk_user_id', sa.String(), nullable=True))
    op.drop_column('users', 'password_hash')
    op.drop_column('users', 'telegram_username')
    op.drop_column('users', 'email')
    op.drop_column('users', 'name')
