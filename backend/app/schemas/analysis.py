from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.analysis import AnalysisModelType
from app.models.study import StudyParameterKey


class AnalysisScope(str, Enum):
    LAST_24H = "last_24h"
    LAST_48H = "last_48h"
    LAST_7_DAYS = "last_7_days"
    CUSTOM = "custom"


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

    @field_validator("start_date", "end_date")
    @classmethod
    def validate_dates(cls, value: datetime | None) -> datetime | None:
        return normalize_to_utc(value)

    @model_validator(mode="after")
    def validate_custom_interval(self):
        if self.scope == AnalysisScope.CUSTOM:
            if self.start_date is None or self.end_date is None:
                raise ValueError(
                    "Pentru interval personalizat trebuie completate start_date și end_date."
                )

        if self.start_date and self.end_date and self.end_date <= self.start_date:
            raise ValueError("Data de final trebuie să fie după data de început.")

        return self


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

    analysis_start_date: datetime | None = None
    analysis_end_date: datetime | None = None
    analysis_scope: str

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisRunResponse(BaseModel):
    message: str
    results: list[AnalysisResultResponse]