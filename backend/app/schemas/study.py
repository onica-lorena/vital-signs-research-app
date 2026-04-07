from datetime import datetime
from math import ceil

from pydantic import BaseModel, ConfigDict, Field

from app.models.study import (
    DataEntryMode,
    MeasurementFrequency,
    StudyParameterKey,
    StudyStatus,
    StudyType,
)


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