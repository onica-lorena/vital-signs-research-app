from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.participant import ParticipantSubmission, ParticipantSubmissionStatus
from app.models.user import User, UserRole
from app.schemas.participant import (
    ParticipantSubmissionDetailResponse,
    ParticipantSubmissionUpdate,
    ParticipantSubmissionValueResponse,
    StudyDataSummaryResponse,
    StudyDataTimelinePointResponse,
    StudySubmissionDetailResponse,
    StudySubmissionListItemResponse,
    StudySubmissionListResponse,
)
from app.services.participant_service import (
    get_study_data_summary,
    get_study_data_timeline,
    get_study_submission_for_current_user,
    list_study_submissions,
    update_study_submission_for_current_user,
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
        participant_id=participant.id,
        participant_code=participant.participant_code,
        participant_full_name=participant.full_name,
        status=submission.status,
        submitted_at=submission.submitted_at,
        values_count=len(submission.values),
    )


def _to_study_submission_detail(
    submission: ParticipantSubmission,
) -> StudySubmissionDetailResponse:
    participant = submission.participant

    return StudySubmissionDetailResponse(
        id=submission.id,
        participant_id=participant.id,
        participant_code=participant.participant_code,
        participant_full_name=participant.full_name,
        status=submission.status,
        notes=submission.notes,
        submitted_at=submission.submitted_at,
        values=[
            ParticipantSubmissionValueResponse.model_validate(value)
            for value in submission.values
        ],
    )


@router.get("/", response_model=StudySubmissionListResponse, summary="Listează trimiterile unui studiu")
def read_study_submissions(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
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
    "/{submission_id}",
    response_model=StudySubmissionDetailResponse,
    summary="Detalii trimitere dintr-un studiu",
)
def read_study_submission_detail(
    study_id: int,
    submission_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
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


@router.get(
    "/summary/data",
    response_model=StudyDataSummaryResponse,
    summary="Rezumat date colectate pentru studiu",
)
def read_study_data_summary(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
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
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN))],
    group_by: str = Query("week", pattern="^(day|week|month)$"),
):
    try:
        items = get_study_data_timeline(
            db=db,
            study_id=study_id,
            current_user=current_user,
            group_by=group_by,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return [StudyDataTimelinePointResponse(**item) for item in items]