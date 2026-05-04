"""create analysis runs table

Revision ID: ccba8d3ebb74
Revises: 5718119b123d
Create Date: 2026-05-04 17:16:25.600065

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'ccba8d3ebb74'
down_revision: Union[str, Sequence[str], None] = "5718119b123d"
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


def upgrade() -> None:
    op.create_table(
        "analysis_runs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("study_id", sa.Integer(), nullable=False),
        sa.Column("requested_participant_id", sa.Integer(), nullable=True),

        sa.Column("analysis_scope", sa.String(length=50), nullable=False),
        sa.Column("analysis_start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("analysis_end_date", sa.DateTime(timezone=True), nullable=True),

        sa.Column("filter_age_min", sa.Integer(), nullable=True),
        sa.Column("filter_age_max", sa.Integer(), nullable=True),
        sa.Column("filter_sex", sa.String(length=50), nullable=True),
        sa.Column("filter_participant_group", sa.String(length=100), nullable=True),
        sa.Column("filter_activity_level", sa.String(length=50), nullable=True),
        sa.Column("filter_condition_type", sa.String(length=50), nullable=True),
        sa.Column("filter_measurement_context", sa.String(length=50), nullable=True),

        sa.Column("participants_analyzed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_results", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("high_risk_results", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("low_risk_results", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_used", sa.Integer(), nullable=False, server_default="0"),

        sa.Column("max_risk_probability", sa.Float(), nullable=True),
        sa.Column("max_risk_parameter_key", study_parameter_key_enum, nullable=True),

        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),

        sa.ForeignKeyConstraint(
            ["study_id"],
            ["studies.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["requested_participant_id"],
            ["study_participants.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(op.f("ix_analysis_runs_id"), "analysis_runs", ["id"], unique=False)
    op.create_index(op.f("ix_analysis_runs_study_id"), "analysis_runs", ["study_id"], unique=False)
    op.create_index(
        op.f("ix_analysis_runs_requested_participant_id"),
        "analysis_runs",
        ["requested_participant_id"],
        unique=False,
    )
    op.create_index(op.f("ix_analysis_runs_created_at"), "analysis_runs", ["created_at"], unique=False)

    op.add_column(
        "analysis_results",
        sa.Column("analysis_run_id", sa.Integer(), nullable=True),
    )

    op.create_foreign_key(
        "fk_analysis_results_analysis_run_id",
        "analysis_results",
        "analysis_runs",
        ["analysis_run_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_index(
        op.f("ix_analysis_results_analysis_run_id"),
        "analysis_results",
        ["analysis_run_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_analysis_results_analysis_run_id"), table_name="analysis_results")
    op.drop_constraint(
        "fk_analysis_results_analysis_run_id",
        "analysis_results",
        type_="foreignkey",
    )
    op.drop_column("analysis_results", "analysis_run_id")

    op.drop_index(op.f("ix_analysis_runs_created_at"), table_name="analysis_runs")
    op.drop_index(op.f("ix_analysis_runs_requested_participant_id"), table_name="analysis_runs")
    op.drop_index(op.f("ix_analysis_runs_study_id"), table_name="analysis_runs")
    op.drop_index(op.f("ix_analysis_runs_id"), table_name="analysis_runs")
    op.drop_table("analysis_runs")