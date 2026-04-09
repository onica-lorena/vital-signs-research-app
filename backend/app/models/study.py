from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.participant import StudyParticipant
    from app.models.user import User


class StudyType(str, Enum):
    OBSERVATIONAL_PROSPECTIVE = "observational_prospective"
    OBSERVATIONAL_RETROSPECTIVE = "observational_retrospective"
    OBSERVATIONAL_MIXED = "observational_mixed"


class DataEntryMode(str, Enum):
    MANUAL = "manual"
    CSV = "csv"
    MANUAL_CSV = "manual_csv"


class StudyStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    IN_ANALYSIS = "in_analysis"
    COMPLETED = "completed"


class StudyParameterKey(str, Enum):
    HEART_RATE = "heartRate"
    RESPIRATORY_RATE = "respiratoryRate"
    SPO2 = "spo2"
    TEMPERATURE = "temperature"


class MeasurementFrequency(str, Enum):
    CONTINUOUS = "continuous"
    EVERY_1_MIN = "every_1_min"
    EVERY_5_MIN = "every_5_min"
    EVERY_15_MIN = "every_15_min"
    EVERY_30_MIN = "every_30_min"
    EVERY_1_HOUR = "every_1_hour"


class Study(Base):
    __tablename__ = "studies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    study_type: Mapped[StudyType] = mapped_column(
        SqlEnum(StudyType, name="study_type"),
        nullable=False,
    )
    data_entry_mode: Mapped[DataEntryMode] = mapped_column(
        SqlEnum(DataEntryMode, name="data_entry_mode"),
        nullable=False,
    )
    status: Mapped[StudyStatus] = mapped_column(
        SqlEnum(StudyStatus, name="study_status"),
        nullable=False,
        default=StudyStatus.DRAFT,
    )

    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    institution: Mapped[str | None] = mapped_column(String(255), nullable=True)
    target_participants: Mapped[int | None] = mapped_column(Integer, nullable=True)
    collection_rules: Mapped[str | None] = mapped_column(Text, nullable=True)
    inclusion_criteria: Mapped[str | None] = mapped_column(Text, nullable=True)
    administrative_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    participants_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    researcher_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    researcher: Mapped["User"] = relationship(
        "User",
        back_populates="studies",
    )

    parameters: Mapped[list["StudyParameter"]] = relationship(
        back_populates="study",
        cascade="all, delete-orphan",
    )

    participants: Mapped[list["StudyParticipant"]] = relationship(
        "StudyParticipant",
        back_populates="study",
        cascade="all, delete-orphan",
    )

    @property
    def can_delete(self) -> bool:
        return self.status == StudyStatus.DRAFT and self.participants_count == 0

    @property
    def delete_restriction_reason(self) -> str | None:
        if self.status != StudyStatus.DRAFT:
            return "Doar studiile aflate în starea de ciornă pot fi șterse."
        if self.participants_count > 0:
            return "Studiul are participanți înregistrați și nu mai poate fi șters."
        return None


class StudyParameter(Base):
    __tablename__ = "study_parameters"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    study_id: Mapped[int] = mapped_column(
        ForeignKey("studies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    parameter_key: Mapped[StudyParameterKey] = mapped_column(
        SqlEnum(StudyParameterKey, name="study_parameter_key"),
        nullable=False,
    )

    measurement_frequency: Mapped[MeasurementFrequency] = mapped_column(
        SqlEnum(MeasurementFrequency, name="measurement_frequency"),
        nullable=False,
    )

    study: Mapped["Study"] = relationship(back_populates="parameters")