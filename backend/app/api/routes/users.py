from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.core.security import (
    get_password_hash,
    validate_password_strength,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import MessageResponse
from app.schemas.user import (
    AdminUserPasswordUpdate,
    UserAdminUpdate,
    UserCreate,
    UserPasswordUpdate,
    UserResponse,
    UserSelfUpdate,
    UserStatusUpdate,
)
from app.services.auth_service import get_user_by_email, get_user_by_id, list_users

router = APIRouter(prefix="/users", tags=["Users"])


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilizatorul nu a fost găsit.",
        )
    return user


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    email = str(payload.email).strip().lower()

    existing_user = get_user_by_email(db, email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Există deja un utilizator cu acest email.",
        )

    try:
        validate_password_strength(payload.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
        
    user = User(
        email=email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
        is_verified=True,
        institution=payload.institution,
        department=payload.department,
        specialization=payload.specialization,
        phone=payload.phone,
        bio=payload.bio,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.get("/", response_model=list[UserResponse])
def read_users(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    users = list_users(db)
    return [UserResponse.model_validate(user) for user in users]


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    payload: UserSelfUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    data = payload.model_dump(exclude_unset=True)

    if "full_name" in data and data["full_name"] is not None:
        current_user.full_name = data["full_name"]

    if "specialization" in data:
        current_user.specialization = data["specialization"]

    if "phone" in data:
        current_user.phone = data["phone"]

    if "bio" in data:
        current_user.bio = data["bio"]

    if "department" in data:
        current_user.department = data["department"]

    if "institution" in data:
        current_user.institution = data["institution"]

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.patch("/me/password", response_model=MessageResponse)
def change_my_password(
    payload: UserPasswordUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parola curentă este incorectă.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Noua parolă trebuie să fie diferită de parola curentă.",
        )

    try:
        validate_password_strength(payload.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.reset_password_token_hash = None
    current_user.reset_password_expires_at = None

    db.add(current_user)
    db.commit()

    return MessageResponse(message="Parola a fost actualizată cu succes.")


@router.get("/{user_id}", response_model=UserResponse)
def read_user_by_id(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    user = _get_user_or_404(db, user_id)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    user = _get_user_or_404(db, user_id)
    data = payload.model_dump(exclude_unset=True)

    if "full_name" in data and data["full_name"] is not None:
        user.full_name = data["full_name"]
    
    if "role" in data and data["role"] is not None:
        if current_admin.id == user.id and data["role"] != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nu îți poți schimba propriul rol din admin în alt rol.",
            )
        user.role = data["role"]
    
    if "is_verified" in data and data["is_verified"] is not None:
        user.is_verified = data["is_verified"]

    if "institution" in data:
        user.institution = data["institution"]

    if "department" in data:
        user.department = data["department"]

    if "specialization" in data:
        user.specialization = data["specialization"]

    if "phone" in data:
        user.phone = data["phone"]

    if "bio" in data:
        user.bio = data["bio"]

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)

@router.patch("/{user_id}/password", response_model=MessageResponse)
def admin_reset_user_password(
    user_id: int,
    payload: AdminUserPasswordUpdate,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    user = _get_user_or_404(db, user_id)

    if verify_password(payload.new_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Noua parolă trebuie să fie diferită de parola actuală.",
        )

    try:
        validate_password_strength(payload.new_password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    user.hashed_password = get_password_hash(payload.new_password)
    user.reset_password_token_hash = None
    user.reset_password_expires_at = None

    db.add(user)
    db.commit()

    return MessageResponse(message="Parola utilizatorului a fost actualizată cu succes.")


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    user = _get_user_or_404(db, user_id)

    if current_admin.id == user.id and payload.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nu îți poți dezactiva propriul cont.",
        )

    user.is_active = payload.is_active

    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)