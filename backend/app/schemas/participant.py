from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.participant import ParticipantStatus, ParticipantSubmissionStatus
from app.models.study import DataEntryMode, MeasurementFrequency, StudyParameterKey, StudyStatus


def normalize_to_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


class ParticipantCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    participant_identifier: str = Field(min_length=2, max_length=100)
    notes: str | None = None
    pin: str | None = Field(default=None, min_length=4, max_length=12)

    @field_validator("full_name", mode="before")
    @classmethod
    def normalize_full_name(cls, value):
        if isinstance(value, str):
            return " ".join(value.strip().split())
        return value

    @field_validator("participant_identifier", mode="before")
    @classmethod
    def normalize_identifier(cls, value):
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("pin", mode="before")
    @classmethod
    def normalize_pin(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class ParticipantUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    participant_identifier: str | None = Field(default=None, min_length=2, max_length=100)
    status: ParticipantStatus | None = None
    notes: str | None = None

    @field_validator("full_name", mode="before")
    @classmethod
    def normalize_full_name(cls, value):
        if isinstance(value, str):
            return " ".join(value.strip().split())
        return value

    @field_validator("participant_identifier", mode="before")
    @classmethod
    def normalize_identifier(cls, value):
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class ParticipantListItemResponse(BaseModel):
    id: int
    participant_code: str
    full_name: str
    participant_identifier: str
    status: ParticipantStatus
    submissions_count: int
    last_login_at: datetime | None = None
    last_submission_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParticipantDetailResponse(BaseModel):
    id: int
    study_id: int
    participant_code: str
    full_name: str
    participant_identifier: str
    status: ParticipantStatus
    submissions_count: int
    last_login_at: datetime | None = None
    last_submission_at: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParticipantCreateResponse(ParticipantDetailResponse):
    temporary_pin: str


class ParticipantPinResetResponse(BaseModel):
    participant_id: int
    participant_code: str
    temporary_pin: str


class ParticipantListResponse(BaseModel):
    items: list[ParticipantListItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ParticipantSummaryResponse(BaseModel):
    total_participants: int
    invited_participants: int
    active_participants: int
    suspended_participants: int
    completed_participants: int
    withdrawn_participants: int


class ParticipantStudyLookupRequest(BaseModel):
    study_code: str = Field(min_length=3, max_length=50)

    @field_validator("study_code", mode="before")
    @classmethod
    def normalize_study_code(cls, value):
        if isinstance(value, str):
            return value.strip().upper()
        return value


class ParticipantStudyLookupResponse(BaseModel):
    study_id: int
    study_code: str
    title: str
    status: StudyStatus
    data_entry_mode: DataEntryMode
    requires_participant_code: bool = True


class ParticipantLoginRequest(BaseModel):
    study_code: str = Field(min_length=3, max_length=50)
    participant_code: str = Field(min_length=2, max_length=50)
    pin: str = Field(min_length=4, max_length=12)

    @field_validator("study_code", "participant_code", mode="before")
    @classmethod
    def normalize_codes(cls, value):
        if isinstance(value, str):
            return value.strip().upper()
        return value

    @field_validator("pin", mode="before")
    @classmethod
    def normalize_pin(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value


class ParticipantParameterInfo(BaseModel):
    parameter_key: StudyParameterKey
    measurement_frequency: MeasurementFrequency

    model_config = ConfigDict(from_attributes=True)


class ParticipantPortalStudyInfo(BaseModel):
    id: int
    code: str
    title: str
    status: StudyStatus
    data_entry_mode: DataEntryMode


class ParticipantPortalParticipantInfo(BaseModel):
    id: int
    participant_code: str
    full_name: str
    status: ParticipantStatus
    submissions_count: int
    last_login_at: datetime | None = None
    last_submission_at: datetime | None = None


class ParticipantPortalContextResponse(BaseModel):
    participant: ParticipantPortalParticipantInfo
    study: ParticipantPortalStudyInfo
    parameters: list[ParticipantParameterInfo]


class ParticipantAccessTokenResponse(BaseModel):
    access_token: str
    token_type: str
    context: ParticipantPortalContextResponse


class ParticipantSubmissionValueCreate(BaseModel):
    parameter_key: StudyParameterKey
    value: float
    measured_at: datetime | None = None

    @field_validator("measured_at")
    @classmethod
    def validate_measured_at(cls, value: datetime | None) -> datetime | None:
        return normalize_to_utc(value)


class ParticipantSubmissionCreate(BaseModel):
    notes: str | None = None
    values: list[ParticipantSubmissionValueCreate] = Field(min_length=1)

    @field_validator("notes", mode="before")
    @classmethod
    def normalize_notes(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @model_validator(mode="after")
    def ensure_unique_parameter_keys(self):
        keys = [item.parameter_key for item in self.values]
        if len(keys) != len(set(keys)):
            raise ValueError("Nu poți trimite același parametru de mai multe ori în aceeași înregistrare.")
        return self


class ParticipantSubmissionValueResponse(BaseModel):
    id: int
    parameter_key: StudyParameterKey
    value: float
    measured_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ParticipantSubmissionListItemResponse(BaseModel):
    id: int
    status: ParticipantSubmissionStatus
    submitted_at: datetime
    values_count: int


class ParticipantSubmissionDetailResponse(BaseModel):
    id: int
    status: ParticipantSubmissionStatus
    notes: str | None = None
    submitted_at: datetime
    values: list[ParticipantSubmissionValueResponse]

    model_config = ConfigDict(from_attributes=True)