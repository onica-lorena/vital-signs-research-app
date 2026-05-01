from typing import Annotated
from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.participant import ParticipantDataEntryMethod, ParticipantSubmission, ParticipantSubmissionStatus
from app.models.user import User, UserRole
from app.schemas.participant import (
    ParticipantHistoryStatus,
    ParticipantSubmissionDetailResponse,
    ParticipantSubmissionUpdate,
    ParticipantSubmissionValueResponse,
    StudyDataSummaryResponse,
    StudyDataTimelinePointResponse,
    StudySubmissionDetailResponse,
    StudySubmissionListItemResponse,
    StudySubmissionListResponse,
    StudySubmissionSessionDetailResponse,
    StudySubmissionSessionListResponse,
)
from app.services.participant_service import (
    get_study_data_summary,
    get_study_data_timeline,
    get_study_submission_for_current_user,
    get_study_submission_session_for_current_user,
    list_study_submission_sessions,
    list_study_submissions,
    update_study_submission_for_current_user,
    update_study_submission_session_status_for_current_user,
)

router = APIRouter(
    prefix="/studies/{study_id}/submissions",
    tags=["Study Submissions"],
)


def _to_study_submission_list_item(
    submission: ParticipantSubmission,
) -> StudySubmissionListItemResponse:
    participant = submission.participant

    return StudySubmissionListItemResponse(
        id=submission.id,
        session_id=submission.session_id,
        participant_id=participant.id,
        participant_code=participant.participant_code,
        participant_full_name=participant.full_name,
        entry_method=submission.entry_method,
        status=submission.status,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at,
        values_count=len(submission.values),
    )


def _to_study_submission_detail(
    submission: ParticipantSubmission,
) -> StudySubmissionDetailResponse:
    participant = submission.participant

    return StudySubmissionDetailResponse(
        id=submission.id,
        session_id=submission.session_id,
        participant_id=participant.id,
        participant_code=participant.participant_code,
        participant_full_name=participant.full_name,
        entry_method=submission.entry_method,
        status=submission.status,
        participant_notes=submission.participant_notes,
        review_notes=submission.review_notes,
        submitted_at=submission.submitted_at,
        reviewed_at=submission.reviewed_at,
        values=[
            ParticipantSubmissionValueResponse.model_validate(value)
            for value in submission.values
        ],
    )


def _parse_datetime(value: str | None, *, end_of_day: bool = False):
    if not value:
        return None

    try:
        if len(value) == 10:
            parsed_date = datetime.fromisoformat(value).date()
            parsed = datetime.combine(
                parsed_date,
                time.max if end_of_day else time.min,
            )
        else:
            parsed = datetime.fromisoformat(value)

        if parsed.tzinfo is None or parsed.utcoffset() is None:
            return parsed.replace(tzinfo=timezone.utc)

        return parsed.astimezone(timezone.utc)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formatul datei nu este valid. Folosește format ISO, de exemplu 2026-05-01 sau 2026-05-01T00:00:00.",
        ) from exc
    
@router.get("/", response_model=StudySubmissionListResponse, summary="Listează trimiterile unui studiu")
def read_study_submissions(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: ParticipantSubmissionStatus | None = Query(None),
    participant_id: int | None = Query(None, ge=1),
):
    try:
        items, total, total_pages = list_study_submissions(
            db=db,
            study_id=study_id,
            current_user=current_user,
            page=page,
            page_size=page_size,
            search=search,
            status=status,
            participant_id=participant_id,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return StudySubmissionListResponse(
        items=[_to_study_submission_list_item(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/summary/data",
    response_model=StudyDataSummaryResponse,
    summary="Rezumat date colectate pentru studiu",
)
def read_study_data_summary(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        summary = get_study_data_summary(
            db=db,
            study_id=study_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return StudyDataSummaryResponse(**summary)


@router.get(
    "/timeline/data",
    response_model=list[StudyDataTimelinePointResponse],
    summary="Timeline date colectate pentru studiu",
)
def read_study_data_timeline(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
    group_by: str = Query("day", pattern="^(day|five_days|month)$"),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
):
    try:
        items = get_study_data_timeline(
            db=db,
            study_id=study_id,
            current_user=current_user,
            group_by=group_by,
            start_date=_parse_datetime(start_date),
            end_date=_parse_datetime(end_date, end_of_day=True),
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return [StudyDataTimelinePointResponse(**item) for item in items]

@router.get(
    "/sessions",
    response_model=StudySubmissionSessionListResponse,
    summary="Listează sesiunile de trimitere ale unui studiu",
)
def read_study_submission_sessions(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    entry_method: ParticipantDataEntryMethod | None = Query(None),
    status_summary: ParticipantHistoryStatus | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    sort_by: str = Query("submitted_at", pattern="^(submitted_at|participant|records_count|values_count|status)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
):
    try:
        items, total, total_pages = list_study_submission_sessions(
            db=db,
            study_id=study_id,
            current_user=current_user,
            page=page,
            page_size=page_size,
            search=search,
            entry_method=entry_method,
            status_summary=status_summary,
            start_date=_parse_datetime(start_date),
            end_date=_parse_datetime(end_date, end_of_day=True),
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return StudySubmissionSessionListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/sessions/{session_id}",
    response_model=StudySubmissionSessionDetailResponse,
    summary="Detalii sesiune de trimitere dintr-un studiu",
)
def read_study_submission_session_detail(
    study_id: int,
    session_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        detail = get_study_submission_session_for_current_user(
            db=db,
            study_id=study_id,
            session_id=session_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesiunea de trimitere nu a fost găsită.",
        )

    return StudySubmissionSessionDetailResponse(**detail)



@router.patch(
    "/sessions/{session_id}/status",
    response_model=StudySubmissionSessionDetailResponse,
    summary="Actualizează statusul unei sesiuni de trimitere",
)
def update_study_submission_session_status(
    study_id: int,
    session_id: int,
    payload: ParticipantSubmissionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        detail = update_study_submission_session_status_for_current_user(
            db=db,
            study_id=study_id,
            session_id=session_id,
            current_user=current_user,
            payload=payload,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sesiunea de trimitere nu a fost găsită.",
        )

    return StudySubmissionSessionDetailResponse(**detail)


@router.get(
    "/{submission_id}",
    response_model=StudySubmissionDetailResponse,
    summary="Detalii trimitere dintr-un studiu",
)
def read_study_submission_detail(
    study_id: int,
    submission_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        submission = get_study_submission_for_current_user(
            db=db,
            study_id=study_id,
            submission_id=submission_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trimiterea nu a fost găsită.",
        )

    return _to_study_submission_detail(submission)


@router.patch(
    "/{submission_id}",
    response_model=StudySubmissionDetailResponse,
    summary="Actualizează statusul unei trimiteri",
)
def update_study_submission(
    study_id: int,
    submission_id: int,
    payload: ParticipantSubmissionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        submission = update_study_submission_for_current_user(
            db=db,
            study_id=study_id,
            submission_id=submission_id,
            current_user=current_user,
            payload=payload,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trimiterea nu a fost găsită.",
        )

    return _to_study_submission_detail(submission)

