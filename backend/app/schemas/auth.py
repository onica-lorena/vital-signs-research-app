from pydantic import BaseModel, EmailStr

from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenData(BaseModel):
    sub: str | None = None
    role: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse