from datetime import datetime

from pydantic import BaseModel

from app.models.analysis import AnalysisModelType
from app.models.study import StudyParameterKey
from app.schemas.participant import ParticipantSummaryResponse, StudyDataSummaryResponse
from app.schemas.study import StudyDetailResponse


class ReportAnalysisResultItem(BaseModel):
    id: int
    analysis_run_id: int | None = None
    participant_id: int
    participant_code: str
    participant_full_name: str
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


class StudyReportResponse(BaseModel):
    generated_at: datetime
    study: StudyDetailResponse
    participants_summary: ParticipantSummaryResponse
    data_summary: StudyDataSummaryResponse
    analysis_results: list[ReportAnalysisResultItem]
    conclusions: list[str]


class AnalysisRunReportParticipantResultItem(BaseModel):
    id: int
    participant_id: int
    participant_code: str
    participant_full_name: str
    parameter_key: StudyParameterKey
    model_type: AnalysisModelType
    model_name: str
    risk_probability: float
    risk_label: str
    records_used: int
    window_size: int | None = None


class AnalysisRunReportParticipantItem(BaseModel):
    participant_id: int
    participant_code: str
    participant_full_name: str
    highest_risk_probability: float
    high_risk_count: int
    low_risk_count: int
    records_used: int
    results: list[AnalysisRunReportParticipantResultItem]


class AnalysisRunReportResponse(BaseModel):
    generated_at: datetime
    study: StudyDetailResponse

    analysis_run_id: int
    analysis_scope: str
    analysis_start_date: datetime | None = None
    analysis_end_date: datetime | None = None
    created_at: datetime

    filter_age_min: int | None = None
    filter_age_max: int | None = None
    filter_sex: str | None = None
    filter_participant_group: str | None = None
    filter_activity_level: str | None = None
    filter_condition_type: str | None = None
    filter_measurement_context: str | None = None

    participants_count: int
    total_results: int
    high_risk_results: int
    low_risk_results: int
    records_used: int
    max_risk_probability: float | None = None
    max_risk_parameter_key: StudyParameterKey | None = None

    average_risk_by_parameter: list[dict]
    participants: list[AnalysisRunReportParticipantItem]
    conclusions: list[str]