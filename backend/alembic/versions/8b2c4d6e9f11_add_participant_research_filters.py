"""add participant research filters

Revision ID: 8b2c4d6e9f11
Revises: 7a9c2e4b8f10
Create Date: 2026-04-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "8b2c4d6e9f11"
down_revision: Union[str, Sequence[str], None] = "7a9c2e4b8f10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


participant_sex_enum = postgresql.ENUM(
    "FEMALE",
    "MALE",
    "OTHER",
    "PREFER_NOT_TO_SAY",
    name="participant_sex",
    create_type=False,
)

activity_level_enum = postgresql.ENUM(
    "SEDENTARY",
    "LIGHT",
    "MODERATE",
    "ACTIVE",
    "ATHLETE",
    "UNKNOWN",
    name="activity_level",
    create_type=False,
)

measurement_context_enum = postgresql.ENUM(
    "REST",
    "DURING_EFFORT",
    "AFTER_EFFORT",
    "AFTER_MEAL",
    "STRESS",
    "SLEEP",
    "UNKNOWN",
    name="measurement_context",
    create_type=False,
)

participant_condition_type_enum = postgresql.ENUM(
    "CARDIOVASCULAR",
    "RESPIRATORY",
    "METABOLIC",
    "NEUROLOGICAL",
    "ENDOCRINE",
    "OTHER",
    "NONE_DECLARED",
    "PREFER_NOT_TO_SAY",
    name="participant_condition_type",
    create_type=False,
)


def upgrade() -> None:
    participant_sex_enum.create(op.get_bind(), checkfirst=True)
    activity_level_enum.create(op.get_bind(), checkfirst=True)
    measurement_context_enum.create(op.get_bind(), checkfirst=True)
    participant_condition_type_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "study_participants",
        sa.Column("birth_date", sa.Date(), nullable=True),
    )
    op.add_column(
        "study_participants",
        sa.Column("sex", participant_sex_enum, nullable=True),
    )
    op.add_column(
        "study_participants",
        sa.Column("participant_group", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "study_participants",
        sa.Column("activity_level", activity_level_enum, nullable=True),
    )

    op.add_column(
        "participant_submission_sessions",
        sa.Column("measurement_context", measurement_context_enum, nullable=True),
    )

    op.create_table(
        "participant_conditions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("participant_id", sa.Integer(), nullable=False),
        sa.Column("condition_type", participant_condition_type_enum, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["participant_id"],
            ["study_participants.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "participant_id",
            "condition_type",
            name="uq_participant_condition_type",
        ),
    )

    op.create_index(
        op.f("ix_participant_conditions_id"),
        "participant_conditions",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_participant_conditions_participant_id"),
        "participant_conditions",
        ["participant_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_participant_conditions_participant_id"),
        table_name="participant_conditions",
    )
    op.drop_index(
        op.f("ix_participant_conditions_id"),
        table_name="participant_conditions",
    )
    op.drop_table("participant_conditions")

    op.drop_column("participant_submission_sessions", "measurement_context")

    op.drop_column("study_participants", "activity_level")
    op.drop_column("study_participants", "participant_group")
    op.drop_column("study_participants", "sex")
    op.drop_column("study_participants", "birth_date")

    participant_condition_type_enum.drop(op.get_bind(), checkfirst=True)
    measurement_context_enum.drop(op.get_bind(), checkfirst=True)
    activity_level_enum.drop(op.get_bind(), checkfirst=True)
    participant_sex_enum.drop(op.get_bind(), checkfirst=True)