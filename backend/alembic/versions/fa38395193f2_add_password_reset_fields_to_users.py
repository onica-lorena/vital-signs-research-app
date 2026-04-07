"""add password reset fields to users

Revision ID: fa38395193f2
Revises: 353f5f6b586c
Create Date: 2026-04-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "fa38395193f2"
down_revision: Union[str, Sequence[str], None] = "353f5f6b586c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("reset_password_token_hash", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("reset_password_expires_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        op.f("ix_users_reset_password_token_hash"),
        "users",
        ["reset_password_token_hash"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_users_reset_password_token_hash"), table_name="users")
    op.drop_column("users", "reset_password_expires_at")
    op.drop_column("users", "reset_password_token_hash")