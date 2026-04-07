"""make timestamps timezone aware

Revision ID: 079e108d890d
Revises: ac29087dad30
Create Date: 2026-04-07 17:23:47.562602

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '079e108d890d'
down_revision: Union[str, Sequence[str], None] = 'ac29087dad30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at AT TIME ZONE 'UTC',
        ALTER COLUMN reset_password_expires_at TYPE TIMESTAMP WITH TIME ZONE USING reset_password_expires_at AT TIME ZONE 'UTC'
    """)

    op.execute("""
        ALTER TABLE studies
        ALTER COLUMN start_date TYPE TIMESTAMP WITH TIME ZONE USING start_date AT TIME ZONE 'UTC',
        ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at AT TIME ZONE 'UTC'
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE USING updated_at AT TIME ZONE 'UTC',
        ALTER COLUMN reset_password_expires_at TYPE TIMESTAMP WITHOUT TIME ZONE USING reset_password_expires_at AT TIME ZONE 'UTC'
    """)

    op.execute("""
        ALTER TABLE studies
        ALTER COLUMN start_date TYPE TIMESTAMP WITHOUT TIME ZONE USING start_date AT TIME ZONE 'UTC',
        ALTER COLUMN created_at TYPE TIMESTAMP WITHOUT TIME ZONE USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE TIMESTAMP WITHOUT TIME ZONE USING updated_at AT TIME ZONE 'UTC'
    """)
