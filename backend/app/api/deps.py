from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
    OAuth2PasswordBearer,
)
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.participant import ParticipantStatus, StudyParticipant
from app.models.user import User, UserRole
from app.services.auth_service import get_user_by_id
from app.services.participant_service import get_participant_by_id

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    scheme_name="UserAuth",
)

participant_bearer_scheme = HTTPBearer(
    scheme_name="ParticipantAuth",
    description="Introdu tokenul obținut din endpoint-ul POST /participant-access/login",
    auto_error=False,
)


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalid sau expirat.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)

        if payload.get("token_type") != "user":
            raise credentials_exception

        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception

        user_id = int(subject)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    user = get_user_by_id(db, user_id=user_id)
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contul este inactiv.",
        )

    return user


def get_current_participant(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(participant_bearer_scheme),
    ],
    db: Annotated[Session, Depends(get_db)],
) -> StudyParticipant:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesiunea participantului este invalidă sau a expirat.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_exception

    token = credentials.credentials

    try:
        payload = decode_token(token)

        if payload.get("token_type") != "participant":
            raise credentials_exception

        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception

        participant_id = int(subject)
        access_version = int(payload.get("access_version"))
    except (JWTError, ValueError, TypeError):
        raise credentials_exception

    participant = get_participant_by_id(db, participant_id)
    if participant is None:
        raise credentials_exception

    if participant.access_version != access_version:
        raise credentials_exception

    if participant.status in {
        ParticipantStatus.SUSPENDED,
        ParticipantStatus.WITHDRAWN,
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesul participantului este restricționat.",
        )

    return participant


def require_role(*allowed_roles: UserRole):
    def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Nu ai permisiunea necesară pentru această acțiune.",
            )
        return current_user

    return role_checker