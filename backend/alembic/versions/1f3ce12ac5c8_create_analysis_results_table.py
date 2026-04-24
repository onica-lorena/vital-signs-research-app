"""create analysis results table

Revision ID: 1f3ce12ac5c8
Revises: e1f2a3b4c5d6
Create Date: 2026-04-24 20:18:05.500289

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "1f3ce12ac5c8"
down_revision: Union[str, Sequence[str], None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


study_parameter_key_enum = postgresql.ENUM(
    "HEART_RATE",
    "RESPIRATORY_RATE",
    "SPO2",
    "TEMPERATURE",
    name="study_parameter_key",
    create_type=False,
)

analysis_model_type_enum = postgresql.ENUM(
    "RANDOM_FOREST",
    "XGBOOST",
    "LSTM",
    name="analysis_model_type",
    create_type=False,
)


def upgrade() -> None:
    analysis_model_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "analysis_results",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("study_id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.Integer(), nullable=False),
        sa.Column("parameter_key", study_parameter_key_enum, nullable=False),
        sa.Column("model_type", analysis_model_type_enum, nullable=False),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("risk_probability", sa.Float(), nullable=False),
        sa.Column("risk_label", sa.String(length=50), nullable=False),
        sa.Column("records_used", sa.Integer(), nullable=False),
        sa.Column("window_size", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["participant_id"],
            ["study_participants.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["study_id"],
            ["studies.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_analysis_results_id"),
        "analysis_results",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_analysis_results_participant_id"),
        "analysis_results",
        ["participant_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_analysis_results_study_id"),
        "analysis_results",
        ["study_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_analysis_results_study_id"), table_name="analysis_results")
    op.drop_index(op.f("ix_analysis_results_participant_id"), table_name="analysis_results")
    op.drop_index(op.f("ix_analysis_results_id"), table_name="analysis_results")
    op.drop_table("analysis_results")