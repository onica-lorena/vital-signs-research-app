from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.access_request import AccessRequestStatus


class AccessRequestCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    institution: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    specialization: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    request_reason: str | None = None

    @field_validator("full_name", mode="before")
    @classmethod
    def normalize_full_name(cls, value):
        if isinstance(value, str):
            return " ".join(value.strip().split())
        return value

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value):
        if isinstance(value, str):
            return value.strip().lower()
        return value

    @field_validator(
        "institution",
        "department",
        "specialization",
        "phone",
        "request_reason",
        mode="before",
    )
    @classmethod
    def normalize_optional_strings(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class AccessRequestReview(BaseModel):
    review_notes: str | None = None

    @field_validator("review_notes", mode="before")
    @classmethod
    def normalize_review_notes(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class AccessRequestResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    institution: str | None = None
    department: str | None = None
    specialization: str | None = None
    phone: str | None = None
    request_reason: str | None = None
    status: AccessRequestStatus
    reviewed_at: datetime | None = None
    review_notes: str | None = None
    reviewed_by_user_id: int | None = None
    created_user_id: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AccessRequestListResponse(BaseModel):
    items: list[AccessRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int