from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.study import StudyParameterKey

if TYPE_CHECKING:
    from app.models.participant import StudyParticipant


class AnalysisModelType(str, Enum):
    RANDOM_FOREST = "random_forest"
    XGBOOST = "xgboost"
    LSTM = "lstm"


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    study_id: Mapped[int] = mapped_column(
        ForeignKey("studies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    requested_participant_id: Mapped[int | None] = mapped_column(
        ForeignKey("study_participants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    analysis_scope: Mapped[str] = mapped_column(String(50), nullable=False)
    analysis_start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    analysis_end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    filter_age_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    filter_age_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    filter_sex: Mapped[str | None] = mapped_column(String(50), nullable=True)
    filter_participant_group: Mapped[str | None] = mapped_column(String(100), nullable=True)
    filter_activity_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    filter_condition_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    filter_measurement_context: Mapped[str | None] = mapped_column(String(50), nullable=True)

    participants_analyzed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_results: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    high_risk_results: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_risk_results: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    records_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    max_risk_probability: Mapped[float | None] = mapped_column(Float, nullable=True)
    max_risk_parameter_key: Mapped[StudyParameterKey | None] = mapped_column(
        SqlEnum(StudyParameterKey, name="study_parameter_key"),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    results: Mapped[list["AnalysisResult"]] = relationship(
        "AnalysisResult",
        back_populates="analysis_run",
        cascade="all, delete-orphan",
    )


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    analysis_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("analysis_runs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

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

    analysis_start_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    analysis_end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    analysis_scope: Mapped[str] = mapped_column(String(50), nullable=False, default="last_48h")

    filter_age_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    filter_age_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    filter_sex: Mapped[str | None] = mapped_column(String(50), nullable=True)
    filter_participant_group: Mapped[str | None] = mapped_column(String(100), nullable=True)
    filter_activity_level: Mapped[str | None] = mapped_column(String(50), nullable=True)
    filter_condition_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    filter_measurement_context: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    analysis_run: Mapped["AnalysisRun | None"] = relationship(
        "AnalysisRun",
        back_populates="results",
    )

    participant: Mapped["StudyParticipant"] = relationship("StudyParticipant")