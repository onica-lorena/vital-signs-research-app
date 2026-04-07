"""create study code sequence

Revision ID: ac29087dad30
Revises: a2722167a32c
Create Date: 2026-04-07 15:57:23.058517

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ac29087dad30'
down_revision: Union[str, Sequence[str], None] = 'a2722167a32c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.execute("CREATE SEQUENCE study_code_seq START WITH 1 INCREMENT BY 1")

    connection = op.get_bind()

    max_code_number = connection.execute(
        sa.text(
            """
            SELECT MAX(CAST(SUBSTRING(code FROM '([0-9]+)$') AS INTEGER))
            FROM studies
            """
        )
    ).scalar()

    if max_code_number is not None:
        connection.execute(
            sa.text("SELECT setval('study_code_seq', :value)"),
            {"value": max_code_number},
        )


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS study_code_seq")
