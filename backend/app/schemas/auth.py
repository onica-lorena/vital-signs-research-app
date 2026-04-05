from pydantic import BaseModel

class TokenData(BaseModel):
    sub: str | None = None
    role: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str