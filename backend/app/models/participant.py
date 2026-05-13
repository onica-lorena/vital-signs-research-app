from datetime import date, datetime, timezone
from enum import Enum

from sqlalchemy import Date, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.study import StudyParameterKey


class ParticipantStatus(str, Enum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"


class ParticipantSubmissionStatus(str, Enum):
    SUBMITTED = "submitted"
    VALIDATED = "validated"
    REJECTED = "rejected"

class ParticipantDataEntryMethod(str, Enum):
    MANUAL = "manual"
    CSV = "csv"

class ParticipantSex(str, Enum):
    FEMALE = "female"
    MALE = "male"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    ATHLETE = "athlete"
    UNKNOWN = "unknown"


class MeasurementContext(str, Enum):
    REST = "rest"
    DURING_EFFORT = "during_effort"
    AFTER_EFFORT = "after_effort"
    AFTER_MEAL = "after_meal"
    STRESS = "stress"
    SLEEP = "sleep"
    UNKNOWN = "unknown"


class ParticipantConditionType(str, Enum):
    CARDIOVASCULAR = "cardiovascular"
    RESPIRATORY = "respiratory"
    METABOLIC = "metabolic"
    NEUROLOGICAL = "neurological"
    ENDOCRINE = "endocrine"
    OTHER = "other"
    NONE_DECLARED = "none_declared"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class StudyParticipant(Base):
    __tablename__ = "study_participants"
    __table_args__ = (
        UniqueConstraint("study_id", "participant_code", name="uq_study_participant_code"),
        UniqueConstraint("study_id", "participant_identifier", name="uq_study_participant_identifier"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    study_id: Mapped[int] = mapped_column(
        ForeignKey("studies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    participant_code: Mapped[str] = mapped_column(String(50), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    participant_identifier: Mapped[str] = mapped_column(String(100), nullable=False)

    birth_date: Mapped[date | None] = mapped_column(Date(), nullable=True)

    sex: Mapped[ParticipantSex | None] = mapped_column(
        SqlEnum(ParticipantSex, name="participant_sex"),
        nullable=True,
    )

    participant_group: Mapped[str | None] = mapped_column(String(100), nullable=True)

    conditions: Mapped[list["ParticipantCondition"]] = relationship(
        "ParticipantCondition",
        back_populates="participant",
        cascade="all, delete-orphan",
    )    

    activity_level: Mapped[ActivityLevel | None] = mapped_column(
        SqlEnum(ActivityLevel, name="activity_level"),
        nullable=True,
    )

    status: Mapped[ParticipantStatus] = mapped_column(
        SqlEnum(ParticipantStatus, name="participant_status"),
        nullable=False,
        default=ParticipantStatus.INVITED,
    )

    selected_data_entry_method: Mapped[ParticipantDataEntryMethod | None] = mapped_column(
        SqlEnum(ParticipantDataEntryMethod, name="participant_data_entry_method"),
        nullable=True,
    )

    sessions: Mapped[list["ParticipantSubmissionSession"]] = relationship(
        "ParticipantSubmissionSession",
        back_populates="participant",
        cascade="all, delete-orphan",
    )

    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    access_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    submissions_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_submission_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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

    study: Mapped["Study"] = relationship("Study", back_populates="participants")
    submissions: Mapped[list["ParticipantSubmission"]] = relationship(
        "ParticipantSubmission",
        back_populates="participant",
        cascade="all, delete-orphan",
    )

class ParticipantSubmissionSession(Base):
    __tablename__ = "participant_submission_sessions"

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

    entry_method: Mapped[ParticipantDataEntryMethod] = mapped_column(
        SqlEnum(ParticipantDataEntryMethod, name="participant_data_entry_method"),
        nullable=False,
    )

    measurement_context: Mapped[MeasurementContext | None] = mapped_column(
        SqlEnum(MeasurementContext, name="measurement_context"),
        nullable=True,
    )    

    source_file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    records_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    interval_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    interval_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

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

    participant: Mapped["StudyParticipant"] = relationship(
        "StudyParticipant",
        back_populates="sessions",
    )

    submissions: Mapped[list["ParticipantSubmission"]] = relationship(
        "ParticipantSubmission",
        back_populates="session",
        cascade="all, delete-orphan",
    )

class ParticipantSubmission(Base):
    __tablename__ = "participant_submissions"

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

    session_id: Mapped[int] = mapped_column(
        ForeignKey("participant_submission_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[ParticipantSubmissionStatus] = mapped_column(
        SqlEnum(ParticipantSubmissionStatus, name="participant_submission_status"),
        nullable=False,
        default=ParticipantSubmissionStatus.SUBMITTED,
    )

    entry_method: Mapped[ParticipantDataEntryMethod] = mapped_column(
        SqlEnum(ParticipantDataEntryMethod, name="participant_data_entry_method"),
        nullable=False,
    )

    participant_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    session: Mapped["ParticipantSubmissionSession"] = relationship(
        "ParticipantSubmissionSession",
        back_populates="submissions",
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    participant: Mapped["StudyParticipant"] = relationship(
        "StudyParticipant",
        back_populates="submissions",
    )
    values: Mapped[list["ParticipantSubmissionValue"]] = relationship(
        "ParticipantSubmissionValue",
        back_populates="submission",
        cascade="all, delete-orphan",
    )


class ParticipantSubmissionValue(Base):
    __tablename__ = "participant_submission_values"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    submission_id: Mapped[int] = mapped_column(
        ForeignKey("participant_submissions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    parameter_key: Mapped[StudyParameterKey] = mapped_column(
        SqlEnum(StudyParameterKey, name="study_parameter_key"),
        nullable=False,
    )

    value: Mapped[float] = mapped_column(Float, nullable=False)

    measured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    submission: Mapped["ParticipantSubmission"] = relationship(
        "ParticipantSubmission",
        back_populates="values",
    )

class ParticipantCondition(Base):
    __tablename__ = "participant_conditions"
    __table_args__ = (
        UniqueConstraint(
            "participant_id",
            "condition_type",
            name="uq_participant_condition_type",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    participant_id: Mapped[int] = mapped_column(
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    condition_type: Mapped[ParticipantConditionType] = mapped_column(
        SqlEnum(ParticipantConditionType, name="participant_condition_type"),
        nullable=False,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    participant: Mapped["StudyParticipant"] = relationship(
        "StudyParticipant",
        back_populates="conditions",
    )

