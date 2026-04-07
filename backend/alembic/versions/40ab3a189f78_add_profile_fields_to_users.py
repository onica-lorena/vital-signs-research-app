"""add profile fields to users

Revision ID: 40ab3a189f78
Revises: fa38395193f2
Create Date: 2026-04-07 11:26:59.688442

"""
"""add profile fields to users

Revision ID: <ID_GENERAT_DE_ALEMBIC>
Revises: fa38395193f2
Create Date: 2026-04-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "<ID_GENERAT_DE_ALEMBIC>"
down_revision: Union[str, Sequence[str], None] = "fa38395193f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("institution", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("department", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("specialization", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "bio")
    op.drop_column("users", "phone")
    op.drop_column("users", "specialization")
    op.drop_column("users", "department")
    op.drop_column("users", "institution")
