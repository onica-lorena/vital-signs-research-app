"""add selectable analysis models

Revision ID: 9f54ecddd8f1
Revises: cabb8c5dbba1
Create Date: 2026-05-29 20:19:50.445515

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '9f54ecddd8f1'
down_revision: Union[str, Sequence[str], None] = 'cabb8c5dbba1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE analysis_model_type ADD VALUE IF NOT EXISTS 'LOGISTIC_REGRESSION'")
    op.execute("ALTER TYPE analysis_model_type ADD VALUE IF NOT EXISTS 'DECISION_TREE'")
    op.execute("ALTER TYPE analysis_model_type ADD VALUE IF NOT EXISTS 'KNN'")
    op.execute("ALTER TYPE analysis_model_type ADD VALUE IF NOT EXISTS 'RNN'")
    op.execute("ALTER TYPE analysis_model_type ADD VALUE IF NOT EXISTS 'LSTM_RF'")
    op.execute("ALTER TYPE analysis_model_type ADD VALUE IF NOT EXISTS 'LSTM_XGBOOST'")

    op.add_column(
        "analysis_runs",
        sa.Column("model_selection", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("analysis_runs", "model_selection")
