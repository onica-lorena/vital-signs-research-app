from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.participant import ParticipantStatus
from app.models.user import User, UserRole
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantCreateResponse,
    ParticipantDetailResponse,
    ParticipantListItemResponse,
    ParticipantListResponse,
    ParticipantPinResetResponse,
    ParticipantSubmissionDetailResponse,
    ParticipantSummaryResponse,
    ParticipantUpdate,
)
from app.services.participant_service import (
    create_study_participant,
    get_participants_summary_for_study,
    get_study_participant_for_current_user,
    list_participant_submissions_for_researcher,
    list_study_participants,
    reset_study_participant_pin,
    update_study_participant_for_current_user,
)

router = APIRouter(
    prefix="/studies/{study_id}/participants",
    tags=["Study Participants"],
)


@router.get("/", response_model=ParticipantListResponse, summary="Listează participanții unui studiu")
def read_study_participants(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: ParticipantStatus | None = Query(None),
):
    try:
        items, total, total_pages = list_study_participants(
            db=db,
            study_id=study_id,
            current_user=current_user,
            page=page,
            page_size=page_size,
            search=search,
            status=status,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ParticipantListResponse(
        items=[ParticipantListItemResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/summary", response_model=ParticipantSummaryResponse, summary="Rezumat participanți")
def read_study_participants_summary(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
):
    try:
        summary = get_participants_summary_for_study(
            db=db,
            study_id=study_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ParticipantSummaryResponse(**summary)


@router.post(
    "/",
    response_model=ParticipantCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Adaugă participant în studiu",
)
def create_participant(
    study_id: int,
    payload: ParticipantCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
):
    try:
        participant, temporary_pin = create_study_participant(
            db=db,
            study_id=study_id,
            current_user=current_user,
            payload=payload,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    base_data = ParticipantDetailResponse.model_validate(participant).model_dump()
    return ParticipantCreateResponse(**base_data, temporary_pin=temporary_pin)


@router.get("/{participant_id}", response_model=ParticipantDetailResponse, summary="Detalii participant")
def read_study_participant(
    study_id: int,
    participant_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
):
    try:
        participant = get_study_participant_for_current_user(
            db=db,
            study_id=study_id,
            participant_id=participant_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participantul nu a fost găsit.",
        )

    return ParticipantDetailResponse.model_validate(participant)


@router.patch("/{participant_id}", response_model=ParticipantDetailResponse, summary="Actualizează participant")
def update_participant(
    study_id: int,
    participant_id: int,
    payload: ParticipantUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
):
    try:
        participant = update_study_participant_for_current_user(
            db=db,
            study_id=study_id,
            participant_id=participant_id,
            current_user=current_user,
            payload=payload,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participantul nu a fost găsit.",
        )

    return ParticipantDetailResponse.model_validate(participant)


@router.post(
    "/{participant_id}/reset-pin",
    response_model=ParticipantPinResetResponse,
    summary="Resetează PIN participant",
)
def reset_participant_pin(
    study_id: int,
    participant_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
):
    try:
        participant, temporary_pin = reset_study_participant_pin(
            db=db,
            study_id=study_id,
            participant_id=participant_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ParticipantPinResetResponse(
        participant_id=participant.id,
        participant_code=participant.participant_code,
        temporary_pin=temporary_pin,
    )


@router.get(
    "/{participant_id}/submissions",
    response_model=list[ParticipantSubmissionDetailResponse],
    summary="Istoric trimiteri participant",
)
def read_participant_submissions(
    study_id: int,
    participant_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
):
    try:
        submissions = list_participant_submissions_for_researcher(
            db=db,
            study_id=study_id,
            participant_id=participant_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return [ParticipantSubmissionDetailResponse.model_validate(item) for item in submissions]