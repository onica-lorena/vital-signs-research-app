from datetime import datetime, timedelta, timezone
from typing import Annotated
import smtplib

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import (
    authenticate_user,
    get_user_by_email,
    get_user_by_reset_token_hash,
)
from app.services.email_service import send_password_reset_email

from app.core.security import (
    create_access_token,
    generate_password_reset_token,
    get_password_hash,
    hash_password_reset_token,
    validate_password_strength,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    email = form_data.username.strip().lower()

    user = authenticate_user(db, email, form_data.password)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email sau parolă incorecte.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={
            "role": user.role.value,
            "token_type": "user",
        },
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
):
    generic_message = (
        "Dacă există un cont asociat acestui email, vei primi instrucțiuni pentru resetarea parolei."
    )

    email = str(payload.email).strip().lower()
    user = get_user_by_email(db, email)

    if user is None:
        return MessageResponse(message=generic_message)

    raw_token = generate_password_reset_token()
    user.reset_password_token_hash = hash_password_reset_token(raw_token)
    user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.reset_password_token_expire_minutes
    )

    db.add(user)
    db.commit()

    reset_link = f"{settings.frontend_base_url}/resetare-parola?token={raw_token}"

    try:
        send_password_reset_email(to_email=email, reset_link=reset_link)
    except smtplib.SMTPException:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nu s-a putut trimite emailul de resetare. Încearcă din nou mai târziu.",
        )

    return MessageResponse(message=generic_message)

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    payload: ResetPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
):
    token_hash = hash_password_reset_token(payload.token)
    user = get_user_by_reset_token_hash(db, token_hash)

    if (
        user is None
        or user.reset_password_expires_at is None
        or user.reset_password_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token invalid sau expirat.",
        )

    try:
        validate_password_strength(payload.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if verify_password(payload.new_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Noua parolă trebuie să fie diferită de parola anterioară.",
        )
    
    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token_hash = None
    user.reset_password_expires_at = None

    db.add(user)
    db.commit()

    return MessageResponse(message="Parola a fost resetată cu succes.")