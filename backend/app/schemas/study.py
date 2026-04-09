from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.study import (
    DataEntryMode,
    MeasurementFrequency,
    StudyParameterKey,
    StudyStatus,
    StudyType,
)

ROMANIAN_FREQUENCY_MAP = {
    "Continuu": MeasurementFrequency.CONTINUOUS,
    "La 1 minut": MeasurementFrequency.EVERY_1_MIN,
    "La 5 minute": MeasurementFrequency.EVERY_5_MIN,
    "La 15 minute": MeasurementFrequency.EVERY_15_MIN,
    "La 30 minute": MeasurementFrequency.EVERY_30_MIN,
    "La 1 oră": MeasurementFrequency.EVERY_1_HOUR,
}


def normalize_to_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


class StudySortBy(str, Enum):
    CREATED_AT = "created_at"
    TITLE = "title"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class StudyResearcherResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class StudyParameterCreate(BaseModel):
    parameter_key: StudyParameterKey
    measurement_frequency: MeasurementFrequency

    @field_validator("measurement_frequency", mode="before")
    @classmethod
    def normalize_measurement_frequency(cls, value):
        if isinstance(value, str):
            return ROMANIAN_FREQUENCY_MAP.get(value, value)
        return value


class StudyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    start_date: datetime | None = None
    end_date: datetime | None = None
    study_type: StudyType
    data_entry_mode: DataEntryMode
    status: StudyStatus = StudyStatus.DRAFT
    description: str | None = None

    institution: str | None = Field(default=None, max_length=255)
    target_participants: int | None = Field(default=None, ge=0)
    collection_rules: str | None = None
    inclusion_criteria: str | None = None
    administrative_notes: str | None = None

    parameters: list[StudyParameterCreate] = Field(min_length=1)

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_dates(cls, value: datetime | None) -> datetime | None:
        return normalize_to_utc(value)

    @model_validator(mode="after")
    def validate_date_interval(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("Data de finalizare trebuie să fie după data de început.")
        return self


class StudyUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    start_date: datetime | None = None
    end_date: datetime | None = None
    study_type: StudyType | None = None
    data_entry_mode: DataEntryMode | None = None
    status: StudyStatus | None = None
    description: str | None = None

    institution: str | None = Field(default=None, max_length=255)
    target_participants: int | None = Field(default=None, ge=0)
    collection_rules: str | None = None
    inclusion_criteria: str | None = None
    administrative_notes: str | None = None

    parameters: list[StudyParameterCreate] | None = Field(default=None, min_length=1)

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_dates(cls, value: datetime | None) -> datetime | None:
        return normalize_to_utc(value)

    @model_validator(mode="after")
    def validate_partial_date_interval(self):
        if self.start_date is not None and self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("Data de finalizare trebuie să fie după data de început.")
        return self


class StudyParameterResponse(BaseModel):
    id: int
    parameter_key: StudyParameterKey
    measurement_frequency: MeasurementFrequency

    model_config = ConfigDict(from_attributes=True)


class StudyListItemResponse(BaseModel):
    id: int
    title: str
    code: str
    description: str | None = None
    study_type: StudyType
    status: StudyStatus
    participants_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StudyDetailResponse(BaseModel):
    id: int
    title: str
    code: str
    description: str | None = None
    study_type: StudyType
    data_entry_mode: DataEntryMode
    status: StudyStatus

    start_date: datetime | None = None
    end_date: datetime | None = None

    institution: str | None = None
    target_participants: int | None = None
    collection_rules: str | None = None
    inclusion_criteria: str | None = None
    administrative_notes: str | None = None

    participants_count: int
    researcher_id: int
    researcher: StudyResearcherResponse

    created_at: datetime
    updated_at: datetime

    can_delete: bool
    delete_restriction_reason: str | None = None

    parameters: list[StudyParameterResponse]

    model_config = ConfigDict(from_attributes=True)


class StudyListResponse(BaseModel):
    items: list[StudyListItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class StudyTypeDistributionItem(BaseModel):
    study_type: StudyType
    count: int


class StudySummaryResponse(BaseModel):
    total_studies: int
    active_studies: int
    studies_in_analysis: int
    completed_studies: int
    study_type_distribution: list[StudyTypeDistributionItem]