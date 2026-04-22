from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.access_request import AccessRequestStatus
from app.models.user import User, UserRole
from app.schemas.access_request import (
    AccessRequestCreate,
    AccessRequestListResponse,
    AccessRequestResponse,
    AccessRequestReview,
)
from app.schemas.auth import MessageResponse
from app.services.access_request_service import (
    approve_access_request,
    create_access_request,
    get_access_request_by_id,
    list_access_requests,
    reject_access_request,
)

router = APIRouter(prefix="/access-requests", tags=["Access Requests"])


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def submit_access_request(
    payload: AccessRequestCreate,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        create_access_request(db=db, payload=payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return MessageResponse(message="Solicitarea de acces a fost trimisă cu succes.")


@router.get("/", response_model=AccessRequestListResponse)
def read_access_requests(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: AccessRequestStatus | None = Query(None),
    search: str | None = Query(None),
):
    items, total, total_pages = list_access_requests(
        db=db,
        page=page,
        page_size=page_size,
        status=status,
        search=search,
    )

    return AccessRequestListResponse(
        items=[AccessRequestResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{access_request_id}", response_model=AccessRequestResponse)
def read_access_request_detail(
    access_request_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    access_request = get_access_request_by_id(db, access_request_id)
    if access_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitarea de acces nu a fost găsită.",
        )

    return AccessRequestResponse.model_validate(access_request)


@router.post("/{access_request_id}/approve", response_model=AccessRequestResponse)
def approve_request(
    access_request_id: int,
    payload: AccessRequestReview,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    try:
        access_request = approve_access_request(
            db=db,
            access_request_id=access_request_id,
            current_admin=current_admin,
            review_notes=payload.review_notes,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return AccessRequestResponse.model_validate(access_request)


@router.post("/{access_request_id}/reject", response_model=AccessRequestResponse)
def reject_request(
    access_request_id: int,
    payload: AccessRequestReview,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    try:
        access_request = reject_access_request(
            db=db,
            access_request_id=access_request_id,
            current_admin=current_admin,
            review_notes=payload.review_notes,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return AccessRequestResponse.model_validate(access_request)