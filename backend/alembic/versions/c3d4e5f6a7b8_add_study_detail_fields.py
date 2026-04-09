"""add study detail fields

Revision ID: c3d4e5f6a7b8
Revises: b1c2d3e4f5a6
Create Date: 2026-04-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("studies", sa.Column("end_date", sa.DateTime(timezone=True), nullable=True))
    op.add_column("studies", sa.Column("institution", sa.String(length=255), nullable=True))
    op.add_column("studies", sa.Column("target_participants", sa.Integer(), nullable=True))
    op.add_column("studies", sa.Column("collection_rules", sa.Text(), nullable=True))
    op.add_column("studies", sa.Column("inclusion_criteria", sa.Text(), nullable=True))
    op.add_column("studies", sa.Column("administrative_notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("studies", "administrative_notes")
    op.drop_column("studies", "inclusion_criteria")
    op.drop_column("studies", "collection_rules")
    op.drop_column("studies", "target_participants")
    op.drop_column("studies", "institution")
    op.drop_column("studies", "end_date")