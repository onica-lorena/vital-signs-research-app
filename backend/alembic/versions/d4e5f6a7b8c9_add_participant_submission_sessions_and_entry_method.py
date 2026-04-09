"""add participant submission sessions and entry method

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


participant_data_entry_method_enum = postgresql.ENUM(
    "MANUAL",
    "CSV",
    name="participant_data_entry_method",
    create_type=False,
)


def upgrade() -> None:
    participant_data_entry_method_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "study_participants",
        sa.Column("selected_data_entry_method", participant_data_entry_method_enum, nullable=True),
    )

    op.create_table(
        "participant_submission_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("study_id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.Integer(), nullable=False),
        sa.Column("entry_method", participant_data_entry_method_enum, nullable=False),
        sa.Column("source_file_name", sa.String(length=255), nullable=True),
        sa.Column("records_count", sa.Integer(), nullable=False),
        sa.Column("interval_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("interval_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["study_id"], ["studies.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_participant_submission_sessions_id"),
        "participant_submission_sessions",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_participant_submission_sessions_study_id"),
        "participant_submission_sessions",
        ["study_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_participant_submission_sessions_participant_id"),
        "participant_submission_sessions",
        ["participant_id"],
        unique=False,
    )

    op.add_column("participant_submissions", sa.Column("session_id", sa.Integer(), nullable=True))
    op.add_column("participant_submissions", sa.Column("entry_method", participant_data_entry_method_enum, nullable=True))
    op.add_column("participant_submissions", sa.Column("participant_notes", sa.Text(), nullable=True))
    op.add_column("participant_submissions", sa.Column("review_notes", sa.Text(), nullable=True))
    op.add_column("participant_submissions", sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True))

    op.create_foreign_key(
        "fk_participant_submissions_session_id",
        "participant_submissions",
        "participant_submission_sessions",
        ["session_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.create_index(
        op.f("ix_participant_submissions_session_id"),
        "participant_submissions",
        ["session_id"],
        unique=False,
    )

    op.execute("""
        UPDATE participant_submissions
        SET participant_notes = notes,
            entry_method = 'MANUAL'
    """)

    op.execute("""
        INSERT INTO participant_submission_sessions (
            study_id,
            participant_id,
            entry_method,
            source_file_name,
            records_count,
            interval_start,
            interval_end,
            created_at,
            updated_at
        )
        SELECT
            study_id,
            participant_id,
            'MANUAL',
            NULL,
            1,
            submitted_at,
            submitted_at,
            submitted_at,
            submitted_at
        FROM participant_submissions
    """)

    op.execute("""
        UPDATE participant_submissions ps
        SET session_id = pss.id
        FROM participant_submission_sessions pss
        WHERE
            pss.study_id = ps.study_id
            AND pss.participant_id = ps.participant_id
            AND pss.entry_method = 'MANUAL'
            AND pss.created_at = ps.submitted_at
            AND ps.session_id IS NULL
    """)

    op.alter_column("participant_submissions", "session_id", nullable=False)
    op.alter_column("participant_submissions", "entry_method", nullable=False)

    op.drop_column("participant_submissions", "notes")


def downgrade() -> None:
    op.add_column("participant_submissions", sa.Column("notes", sa.Text(), nullable=True))

    op.execute("""
        UPDATE participant_submissions
        SET notes = participant_notes
    """)

    op.drop_index(op.f("ix_participant_submissions_session_id"), table_name="participant_submissions")
    op.drop_constraint("fk_participant_submissions_session_id", "participant_submissions", type_="foreignkey")

    op.drop_column("participant_submissions", "reviewed_at")
    op.drop_column("participant_submissions", "review_notes")
    op.drop_column("participant_submissions", "participant_notes")
    op.drop_column("participant_submissions", "entry_method")
    op.drop_column("participant_submissions", "session_id")

    op.drop_index(op.f("ix_participant_submission_sessions_participant_id"), table_name="participant_submission_sessions")
    op.drop_index(op.f("ix_participant_submission_sessions_study_id"), table_name="participant_submission_sessions")
    op.drop_index(op.f("ix_participant_submission_sessions_id"), table_name="participant_submission_sessions")
    op.drop_table("participant_submission_sessions")

    op.drop_column("study_participants", "selected_data_entry_method")

    participant_data_entry_method_enum.drop(op.get_bind(), checkfirst=True)