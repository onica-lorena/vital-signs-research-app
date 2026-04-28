from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, ConfigDict, field_validator, model_validator

from app.models.analysis import AnalysisModelType
from app.models.study import StudyParameterKey
from app.models.participant import ActivityLevel, MeasurementContext, ParticipantConditionType, ParticipantSex


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