"""create participants tables

Revision ID: b1c2d3e4f5a6
Revises: 079e108d890d
Create Date: 2026-04-08 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "079e108d890d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


participant_status_enum = postgresql.ENUM(
    "INVITED",
    "ACTIVE",
    "SUSPENDED",
    "COMPLETED",
    "WITHDRAWN",
    name="participant_status",
)

participant_submission_status_enum = postgresql.ENUM(
    "SUBMITTED",
    "VALIDATED",
    "REJECTED",
    name="participant_submission_status",
)

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
        "study_participants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("study_id", sa.Integer(), nullable=False),
        sa.Column("participant_code", sa.String(length=50), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("participant_identifier", sa.String(length=100), nullable=False),
        sa.Column("status", participant_status_enum, nullable=False),
        sa.Column("pin_hash", sa.String(length=255), nullable=False),
        sa.Column("access_version", sa.Integer(), nullable=False),
        sa.Column("submissions_count", sa.Integer(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_submission_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["study_id"], ["studies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("study_id", "participant_code", name="uq_study_participant_code"),
        sa.UniqueConstraint("study_id", "participant_identifier", name="uq_study_participant_identifier"),
    )
    op.create_index(op.f("ix_study_participants_id"), "study_participants", ["id"], unique=False)
    op.create_index(op.f("ix_study_participants_study_id"), "study_participants", ["study_id"], unique=False)

    op.create_table(
        "participant_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("study_id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.Integer(), nullable=False),
        sa.Column("status", participant_submission_status_enum, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["study_id"], ["studies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_participant_submissions_id"), "participant_submissions", ["id"], unique=False)
    op.create_index(op.f("ix_participant_submissions_participant_id"), "participant_submissions", ["participant_id"], unique=False)
    op.create_index(op.f("ix_participant_submissions_study_id"), "participant_submissions", ["study_id"], unique=False)
    op.create_index(op.f("ix_participant_submissions_submitted_at"), "participant_submissions", ["submitted_at"], unique=False)

    op.create_table(
        "participant_submission_values",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("submission_id", sa.Integer(), nullable=False),
        sa.Column("parameter_key", study_parameter_key_enum, nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("measured_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["participant_submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_participant_submission_values_id"), "participant_submission_values", ["id"], unique=False)
    op.create_index(op.f("ix_participant_submission_values_submission_id"), "participant_submission_values", ["submission_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_participant_submission_values_submission_id"), table_name="participant_submission_values")
    op.drop_index(op.f("ix_participant_submission_values_id"), table_name="participant_submission_values")
    op.drop_table("participant_submission_values")

    op.drop_index(op.f("ix_participant_submissions_submitted_at"), table_name="participant_submissions")
    op.drop_index(op.f("ix_participant_submissions_study_id"), table_name="participant_submissions")
    op.drop_index(op.f("ix_participant_submissions_participant_id"), table_name="participant_submissions")
    op.drop_index(op.f("ix_participant_submissions_id"), table_name="participant_submissions")
    op.drop_table("participant_submissions")

    op.drop_index(op.f("ix_study_participants_study_id"), table_name="study_participants")
    op.drop_index(op.f("ix_study_participants_id"), table_name="study_participants")
    op.drop_table("study_participants")

    participant_submission_status_enum.drop(op.get_bind(), checkfirst=True)
    participant_status_enum.drop(op.get_bind(), checkfirst=True)