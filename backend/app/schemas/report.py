from datetime import datetime

from pydantic import BaseModel

from app.models.analysis import AnalysisModelType
from app.models.study import StudyParameterKey
from app.schemas.participant import ParticipantSummaryResponse, StudyDataSummaryResponse
from app.schemas.study import StudyDetailResponse


class ReportAnalysisResultItem(BaseModel):
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
    created_at: datetime


class StudyReportResponse(BaseModel):
    generated_at: datetime
    study: StudyDetailResponse
    participants_summary: ParticipantSummaryResponse
    data_summary: StudyDataSummaryResponse
    analysis_results: list[ReportAnalysisResultItem]
    conclusions: list[str]