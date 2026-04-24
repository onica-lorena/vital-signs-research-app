from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.analysis import AnalysisModelType
from app.models.study import StudyParameterKey


class AnalysisRunRequest(BaseModel):
    participant_id: int | None = None


class AnalysisResultResponse(BaseModel):
    id: int
    study_id: int
    participant_id: int
    parameter_key: StudyParameterKey
    model_type: AnalysisModelType
    model_name: str
    risk_probability: float
    risk_label: str
    records_used: int
    window_size: int | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisRunResponse(BaseModel):
    message: str
    results: list[AnalysisResultResponse]