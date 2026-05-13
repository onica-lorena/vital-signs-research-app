"""add email to study participants

Revision ID: cabb8c5dbba1
Revises: ccba8d3ebb74
Create Date: 2026-05-13 11:42:47.969077

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cabb8c5dbba1'
down_revision: Union[str, Sequence[str], None] = 'ccba8d3ebb74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "study_participants",
        sa.Column("email", sa.String(length=255), nullable=True),
    )

    op.create_index(
        op.f("ix_study_participants_email"),
        "study_participants",
        ["email"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_study_participants_email"),
        table_name="study_participants",
    )
    op.drop_column("study_participants", "email")