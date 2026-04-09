from typing import Annotated

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_participant
from app.core.database import get_db
from app.models.participant import ParticipantDataEntryMethod, StudyParticipant
from app.models.study import StudyStatus
from app.schemas.participant import (
    ParticipantAccessTokenResponse,
    ParticipantBulkSubmissionCreate,
    ParticipantDataEntryMethodSelectRequest,
    ParticipantDataEntryMethodSelectResponse,
    ParticipantHistoryStatus,
    ParticipantHistorySummaryResponse,
    ParticipantPortalContextResponse,
    ParticipantStudyLookupRequest,
    ParticipantStudyLookupResponse,
    ParticipantLoginRequest,
    ParticipantSubmissionCreate,
    ParticipantSubmissionDetailResponse,
    ParticipantSubmissionListItemResponse,
    ParticipantSubmissionSessionDetailResponse,
    ParticipantSubmissionSessionListResponse,
)
from app.services.participant_service import (
    authenticate_participant,
    build_participant_context,
    create_bulk_participant_submissions,
    create_participant_access_token,
    create_participant_submission,
    get_participant_history_summary,
    get_participant_submission_for_current_participant,
    get_participant_submission_session_detail,
    get_public_study_by_code,
    list_participant_submission_sessions,
    list_participant_submissions_for_current_participant,
    set_participant_data_entry_method,
)

router = APIRouter(prefix="/participant-access", tags=["Participant Access"])


@router.post("/validate-study", response_model=ParticipantStudyLookupResponse, summary="Validează cod studiu")
def validate_study_code(
    payload: ParticipantStudyLookupRequest,
    db: Annotated[Session, Depends(get_db)],
):
    study = get_public_study_by_code(db, payload.study_code)

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Codul studiului nu a fost găsit.",
        )

    if study.status != StudyStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Studiul nu este disponibil pentru accesul participanților.",
        )

    return ParticipantStudyLookupResponse(
        study_id=study.id,
        study_code=study.code,
        title=study.title,
        status=study.status,
        data_entry_mode=study.data_entry_mode,
        requires_participant_code=True,
    )


@router.post("/login", response_model=ParticipantAccessTokenResponse, summary="Autentificare participant")
def login_participant(
    payload: ParticipantLoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        participant = authenticate_participant(
            db=db,
            study_code=payload.study_code,
            participant_code=payload.participant_code,
            pin=payload.pin,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    access_token = create_participant_access_token(participant)
    context = ParticipantPortalContextResponse(**build_participant_context(participant))

    return ParticipantAccessTokenResponse(
        access_token=access_token,
        token_type="bearer",
        context=context,
    )


@router.get("/me", response_model=ParticipantPortalContextResponse, summary="Context participant")
def read_current_participant_context(
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    return ParticipantPortalContextResponse(**build_participant_context(current_participant))


@router.post(
    "/submissions",
    response_model=ParticipantSubmissionDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trimite date participant",
)
def submit_participant_data(
    payload: ParticipantSubmissionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    try:
        submission = create_participant_submission(
            db=db,
            participant=current_participant,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ParticipantSubmissionDetailResponse.model_validate(submission)


@router.post(
    "/data-entry-method",
    response_model=ParticipantDataEntryMethodSelectResponse,
    summary="Setează metoda de furnizare a datelor",
)
def select_data_entry_method(
    payload: ParticipantDataEntryMethodSelectRequest,
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    try:
        participant = set_participant_data_entry_method(
            db=db,
            participant=current_participant,
            method=payload.method,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return ParticipantDataEntryMethodSelectResponse(
        selected_data_entry_method=participant.selected_data_entry_method
    )


@router.get(
    "/submissions",
    response_model=list[ParticipantSubmissionListItemResponse],
    summary="Istoric trimiteri participant",
)
def read_my_submissions(
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    items = list_participant_submissions_for_current_participant(
        db=db,
        participant=current_participant,
    )
    return [ParticipantSubmissionListItemResponse(**item) for item in items]


@router.post(
    "/submissions/bulk",
    response_model=ParticipantSubmissionSessionDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Trimite date participant din CSV",
)
def submit_participant_bulk_data(
    payload: ParticipantBulkSubmissionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    try:
        session = create_bulk_participant_submissions(
            db=db,
            participant=current_participant,
            payload=payload,
        )
        detail = get_participant_submission_session_detail(
            db=db,
            session_id=session.id,
            participant=current_participant,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesiunea de încărcare nu a fost găsită.",
        )

    return ParticipantSubmissionSessionDetailResponse(**detail)


@router.get(
    "/submissions/{submission_id}",
    response_model=ParticipantSubmissionDetailResponse,
    summary="Detalii trimitere participant",
)
def read_my_submission_detail(
    submission_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    submission = get_participant_submission_for_current_participant(
        db=db,
        submission_id=submission_id,
        participant=current_participant,
    )

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Înregistrarea nu a fost găsită.",
        )

    return ParticipantSubmissionDetailResponse.model_validate(submission)


@router.get(
    "/history/summary",
    response_model=ParticipantHistorySummaryResponse,
    summary="Rezumat istoric participant",
)
def read_my_history_summary(
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    summary = get_participant_history_summary(
        db=db,
        participant=current_participant,
    )
    return ParticipantHistorySummaryResponse(**summary)


@router.get(
    "/history",
    response_model=ParticipantSubmissionSessionListResponse,
    summary="Listează sesiunile de trimitere ale participantului",
)
def read_my_history(
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    entry_method: ParticipantDataEntryMethod | None = Query(None),
    status_summary: ParticipantHistoryStatus | None = Query(None),
    search: str | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
):
    parsed_start_date = None
    parsed_end_date = None

    if start_date:
        parsed_start_date = datetime.fromisoformat(start_date)

    if end_date:
        parsed_end_date = datetime.fromisoformat(end_date)

    items, total, total_pages = list_participant_submission_sessions(
        db=db,
        participant=current_participant,
        page=page,
        page_size=page_size,
        entry_method=entry_method,
        status_summary=status_summary,
        search=search,
        start_date=parsed_start_date,
        end_date=parsed_end_date,
    )

    return ParticipantSubmissionSessionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/history/{session_id}",
    response_model=ParticipantSubmissionSessionDetailResponse,
    summary="Detalii sesiune de trimitere participant",
)
def read_my_history_detail(
    session_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_participant: Annotated[StudyParticipant, Depends(get_current_participant)],
):
    detail = get_participant_submission_session_detail(
        db=db,
        session_id=session_id,
        participant=current_participant,
    )

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesiunea de trimitere nu a fost găsită.",
        )

    return ParticipantSubmissionSessionDetailResponse(**detail)