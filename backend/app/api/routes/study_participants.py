from typing import Annotated

import csv
from io import StringIO

from fastapi import File, UploadFile

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.participant import ActivityLevel, ParticipantSex, ParticipantStatus
from app.models.user import User, UserRole
from app.schemas.participant import (
    ParticipantBulkCreate,
    ParticipantBulkCreateItemResponse,
    ParticipantBulkCreateResponse,
    ParticipantCreate,
    ParticipantCreateResponse,
    ParticipantDetailResponse,
    ParticipantListItemResponse,
    ParticipantListResponse,
    ParticipantPinResetResponse,
    ParticipantSortBy,
    ParticipantSubmissionDetailResponse,
    ParticipantSummaryResponse,
    ParticipantUpdate,
    SortOrder,
)
from app.services.participant_service import (
    create_study_participant,
    create_study_participants_bulk,
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: ParticipantStatus | None = Query(None),
    sex: ParticipantSex | None = Query(None),
    activity_level: ActivityLevel | None = Query(None),
    participant_group: str | None = Query(None),
    only_with_submissions: bool = Query(False),
    sort_by: ParticipantSortBy = Query(ParticipantSortBy.CREATED_AT),
    sort_order: SortOrder = Query(SortOrder.DESC),
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
            sex=sex,
            activity_level=activity_level,
            participant_group=participant_group,
            only_with_submissions=only_with_submissions,
            sort_by=sort_by,
            sort_order=sort_order,
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        participant, temporary_pin, email_sent, email_error = create_study_participant(
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
    return ParticipantCreateResponse(
        **base_data,
        temporary_pin=temporary_pin,
        invitation_email_sent=email_sent,
        invitation_email_error=email_error,
    )


@router.post(
    "/bulk",
    response_model=ParticipantBulkCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Importă mai mulți participanți în studiu",
)
def create_participants_bulk(
    study_id: int,
    payload: ParticipantBulkCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        created_items = create_study_participants_bulk(
            db=db,
            study_id=study_id,
            current_user=current_user,
            payloads=payload.participants,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ParticipantBulkCreateResponse(
        created_count=len(created_items),
        items=[
            ParticipantBulkCreateItemResponse(
                participant=ParticipantDetailResponse.model_validate(participant),
                temporary_pin=temporary_pin,
                invitation_email_sent=email_sent,
                invitation_email_error=email_error,
            )
            for participant, temporary_pin, email_sent, email_error in created_items
        ],
    )

@router.post("/bulk-upload", response_model=ParticipantBulkCreateResponse)
def create_participants_bulk_from_csv(
    study_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.RESEARCHER)),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Fișierul trebuie să fie în format CSV.",
        )

    try:
        content = file.file.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Fișierul CSV trebuie să fie salvat în format UTF-8.",
        )

    reader = csv.DictReader(StringIO(content))

    required_columns = {"full_name"}

    if reader.fieldnames is None:
        raise HTTPException(
            status_code=400,
            detail="Fișierul CSV nu conține antet.",
        )

    missing_columns = required_columns - set(reader.fieldnames)

    if missing_columns:
        raise HTTPException(
            status_code=400,
            detail=f"Lipsesc coloanele obligatorii: {', '.join(sorted(missing_columns))}.",
        )

    participants: list[ParticipantCreate] = []

    try:
        for index, row in enumerate(reader, start=2):
            full_name = (row.get("full_name") or "").strip()

            if not full_name:
                raise ValueError(f"Rândul {index}: numele participantului este obligatoriu.")

            condition_type = (row.get("condition_type") or "").strip() or None
            condition_notes = (row.get("condition_notes") or "").strip() or None

            conditions = []

            if condition_type:
                conditions.append(
                    {
                        "condition_type": condition_type,
                        "notes": condition_notes,
                    }
                )

            participant = ParticipantCreate(
                full_name=full_name,
                email=(row.get("email") or "").strip().lower() or None,
                participant_identifier=(row.get("participant_identifier") or "").strip() or None,
                pin=(row.get("pin") or "").strip() or None,
                birth_date=(row.get("birth_date") or "").strip() or None,
                sex=(row.get("sex") or "").strip() or None,
                participant_group=(row.get("participant_group") or "").strip() or None,
                activity_level=(row.get("activity_level") or "").strip() or None,
                notes=(row.get("notes") or "").strip() or None,
                conditions=conditions,
            )

            participants.append(participant)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not participants:
        raise HTTPException(
            status_code=400,
            detail="Fișierul CSV nu conține participanți.",
        )

    try:
        created_items = create_study_participants_bulk(
            db=db,
            study_id=study_id,
            current_user=current_user,
            payloads=participants,
        )

    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return ParticipantBulkCreateResponse(
        created_count=len(created_items),
        items=[
            ParticipantBulkCreateItemResponse(
                participant=ParticipantDetailResponse.model_validate(participant),
                temporary_pin=temporary_pin,
                invitation_email_sent=email_sent,
                invitation_email_error=email_error,
            )
            for participant, temporary_pin, email_sent, email_error in created_items
        ],
    )

@router.get("/{participant_id}", response_model=ParticipantDetailResponse, summary="Detalii participant")
def read_study_participant(
    study_id: int,
    participant_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
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