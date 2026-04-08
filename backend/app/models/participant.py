from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text, UniqueConstraint
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
    participant_identifier: Mapped[str] = mapped_column(String(100), nullable=False)

    status: Mapped[ParticipantStatus] = mapped_column(
        SqlEnum(ParticipantStatus, name="participant_status"),
        nullable=False,
        default=ParticipantStatus.INVITED,
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

    status: Mapped[ParticipantSubmissionStatus] = mapped_column(
        SqlEnum(ParticipantSubmissionStatus, name="participant_submission_status"),
        nullable=False,
        default=ParticipantSubmissionStatus.SUBMITTED,
    )

    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

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