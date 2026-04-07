from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.study import (
    DataEntryMode,
    MeasurementFrequency,
    StudyParameterKey,
    StudyStatus,
    StudyType,
)

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

class StudyParameterCreate(BaseModel):
    parameter_key: StudyParameterKey
    measurement_frequency: MeasurementFrequency


class StudyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    start_date: datetime | None = None
    study_type: StudyType
    data_entry_mode: DataEntryMode
    status: StudyStatus = StudyStatus.DRAFT
    description: str | None = None
    parameters: list[StudyParameterCreate] = Field(min_length=1)

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, value: datetime | None) -> datetime | None:
        return normalize_to_utc(value)

class StudyUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    start_date: datetime | None = None
    study_type: StudyType | None = None
    data_entry_mode: DataEntryMode | None = None
    status: StudyStatus | None = None
    description: str | None = None
    parameters: list[StudyParameterCreate] | None = Field(default=None, min_length=1)

    @field_validator("start_date")
    @classmethod
    def validate_start_date(cls, value: datetime | None) -> datetime | None:
        return normalize_to_utc(value)

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
    participants_count: int
    researcher_id: int
    created_at: datetime
    updated_at: datetime
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