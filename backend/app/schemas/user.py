from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, Field

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    institution: str | None = None
    department: str | None = None
    specialization: str | None = None
    phone: str | None = None
    bio: str | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserAdminUpdate(BaseModel):
    full_name: str | None = None
    role: UserRole | None = None
    is_verified: bool | None = None
    institution: str | None = None
    department: str | None = None
    specialization: str | None = None
    phone: str | None = None
    bio: str | None = None


class UserSelfUpdate(BaseModel):
    full_name: str | None = None
    institution: str | None = None
    department: str | None = None
    specialization: str | None = None
    phone: str | None = None
    bio: str | None = None


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class AdminUserPasswordUpdate(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)