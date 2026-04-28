"""add analysis period fields

Revision ID: 7a9c2e4b8f10
Revises: 1f3ce12ac5c8
Create Date: 2026-04-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7a9c2e4b8f10"
down_revision: Union[str, Sequence[str], None] = "1f3ce12ac5c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "analysis_results",
        sa.Column("analysis_start_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "analysis_results",
        sa.Column("analysis_end_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "analysis_results",
        sa.Column(
            "analysis_scope",
            sa.String(length=50),
            nullable=False,
            server_default="last_48h",
        ),
    )

    op.alter_column("analysis_results", "analysis_scope", server_default=None)


def downgrade() -> None:
    op.drop_column("analysis_results", "analysis_scope")
    op.drop_column("analysis_results", "analysis_end_date")
    op.drop_column("analysis_results", "analysis_start_date")