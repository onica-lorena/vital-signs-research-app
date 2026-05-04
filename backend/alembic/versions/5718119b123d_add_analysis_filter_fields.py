"""add analysis filter fields

Revision ID: 5718119b123d
Revises: 8b2c4d6e9f11
Create Date: 2026-05-04 15:49:49.498915

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5718119b123d"
down_revision: Union[str, Sequence[str], None] = "8b2c4d6e9f11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("analysis_results", sa.Column("filter_age_min", sa.Integer(), nullable=True))
    op.add_column("analysis_results", sa.Column("filter_age_max", sa.Integer(), nullable=True))
    op.add_column("analysis_results", sa.Column("filter_sex", sa.String(length=50), nullable=True))
    op.add_column("analysis_results", sa.Column("filter_participant_group", sa.String(length=100), nullable=True))
    op.add_column("analysis_results", sa.Column("filter_activity_level", sa.String(length=50), nullable=True))
    op.add_column("analysis_results", sa.Column("filter_condition_type", sa.String(length=50), nullable=True))
    op.add_column("analysis_results", sa.Column("filter_measurement_context", sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column("analysis_results", "filter_measurement_context")
    op.drop_column("analysis_results", "filter_condition_type")
    op.drop_column("analysis_results", "filter_activity_level")
    op.drop_column("analysis_results", "filter_participant_group")
    op.drop_column("analysis_results", "filter_sex")
    op.drop_column("analysis_results", "filter_age_max")
    op.drop_column("analysis_results", "filter_age_min")