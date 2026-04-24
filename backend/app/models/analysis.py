from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.study import StudyParameterKey


class AnalysisModelType(str, Enum):
    RANDOM_FOREST = "random_forest"
    XGBOOST = "xgboost"
    LSTM = "lstm"


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    study_id: Mapped[int] = mapped_column(
        ForeignKey("studies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    participant_id: Mapped[int] = mapped_column(
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    parameter_key: Mapped[StudyParameterKey] = mapped_column(
        SqlEnum(StudyParameterKey, name="study_parameter_key"),
        nullable=False,
    )

    model_type: Mapped[AnalysisModelType] = mapped_column(
        SqlEnum(AnalysisModelType, name="analysis_model_type"),
        nullable=False,
    )

    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    risk_probability: Mapped[float] = mapped_column(Float, nullable=False)
    risk_label: Mapped[str] = mapped_column(String(50), nullable=False)

    records_used: Mapped[int] = mapped_column(Integer, nullable=False)
    window_size: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )