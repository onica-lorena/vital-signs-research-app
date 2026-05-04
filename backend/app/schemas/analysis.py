from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.analysis import AnalysisModelType
from app.models.study import StudyParameterKey
from app.models.participant import (
    ActivityLevel,
    MeasurementContext,
    ParticipantConditionType,
    ParticipantSex,
)


class AnalysisScope(str, Enum):
    LAST_24H = "last_24h"
    LAST_48H = "last_48h"
    LAST_7_DAYS = "last_7_days"
    CUSTOM = "custom"


class AnalysisResultSortBy(str, Enum):
    CREATED_AT = "created_at"
    RISK_PROBABILITY = "risk_probability"
    RECORDS_USED = "records_used"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


def normalize_to_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is None or value.utcoffset() is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


class AnalysisRunRequest(BaseModel):
    participant_id: int | None = None
    scope: AnalysisScope = AnalysisScope.LAST_48H
    start_date: datetime | None = None
    end_date: datetime | None = None

    age_min: int | None = None
    age_max: int | None = None
    sex: ParticipantSex | None = None
    participant_group: str | None = None
    activity_level: ActivityLevel | None = None
    condition_type: ParticipantConditionType | None = None
    measurement_context: MeasurementContext | None = None

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_dates(cls, value: datetime | None) -> datetime | None:
        return normalize_to_utc(value)

    @field_validator("participant_group", mode="before")
    @classmethod
    def normalize_participant_group(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @model_validator(mode="after")
    def validate_custom_interval(self):
        if self.scope == AnalysisScope.CUSTOM:
            if self.start_date is None or self.end_date is None:
                raise ValueError(
                    "Pentru interval personalizat trebuie completate start_date și end_date."
                )

        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("Data de final trebuie să fie după data de început.")

        if self.age_min is not None and self.age_min < 0:
            raise ValueError("Vârsta minimă nu poate fi negativă.")

        if self.age_max is not None and self.age_max < 0:
            raise ValueError("Vârsta maximă nu poate fi negativă.")

        if (
            self.age_min is not None
            and self.age_max is not None
            and self.age_max < self.age_min
        ):
            raise ValueError("Vârsta maximă trebuie să fie mai mare sau egală cu vârsta minimă.")

        return self


class AnalysisParticipantResponse(BaseModel):
    id: int
    participant_code: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


class AnalysisResultResponse(BaseModel):
    id: int
    analysis_run_id: int | None = None
    study_id: int
    participant_id: int
    participant: AnalysisParticipantResponse | None = None

    parameter_key: StudyParameterKey
    model_type: AnalysisModelType
    model_name: str
    risk_probability: float
    risk_label: str
    records_used: int
    window_size: int | None = None

    analysis_start_date: datetime | None = None
    analysis_end_date: datetime | None = None
    analysis_scope: str

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    filter_age_min: int | None = None
    filter_age_max: int | None = None
    filter_sex: str | None = None
    filter_participant_group: str | None = None
    filter_activity_level: str | None = None
    filter_condition_type: str | None = None
    filter_measurement_context: str | None = None


class AnalysisResultListResponse(BaseModel):
    items: list[AnalysisResultResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AnalysisRunListItemResponse(BaseModel):
    id: int
    study_id: int
    requested_participant_id: int | None = None

    analysis_scope: str
    analysis_start_date: datetime | None = None
    analysis_end_date: datetime | None = None

    filter_age_min: int | None = None
    filter_age_max: int | None = None
    filter_sex: str | None = None
    filter_participant_group: str | None = None
    filter_activity_level: str | None = None
    filter_condition_type: str | None = None
    filter_measurement_context: str | None = None

    participants_analyzed: int
    total_results: int
    high_risk_results: int
    low_risk_results: int
    records_used: int

    max_risk_probability: float | None = None
    max_risk_parameter_key: StudyParameterKey | None = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisRunDetailResponse(AnalysisRunListItemResponse):
    results: list[AnalysisResultResponse]


class AnalysisRunListResponse(BaseModel):
    items: list[AnalysisRunListItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AnalysisRunResponse(BaseModel):
    message: str
    analysis_run: AnalysisRunDetailResponse
    results: list[AnalysisResultResponse]


class AnalysisAverageRiskByParameterItem(BaseModel):
    parameter_key: StudyParameterKey
    average_risk_probability: float
    results_count: int


class AnalysisRiskDistributionItem(BaseModel):
    risk_label: str
    count: int
    percentage: float


class AnalysisTimelinePointResponse(BaseModel):
    label: str
    high_risk_count: int
    low_risk_count: int
    total_results: int


class AnalysisSummaryResponse(BaseModel):
    total_results: int
    participants_analyzed: int
    high_risk_results: int
    low_risk_results: int
    records_used: int
    average_risk_by_parameter: list[AnalysisAverageRiskByParameterItem]
    risk_distribution: list[AnalysisRiskDistributionItem]
    timeline: list[AnalysisTimelinePointResponse]