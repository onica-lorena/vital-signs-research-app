from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_participant
from app.core.database import get_db
from app.models.participant import StudyParticipant
from app.models.study import StudyStatus
from app.schemas.participant import (
    ParticipantAccessTokenResponse,
    ParticipantPortalContextResponse,
    ParticipantStudyLookupRequest,
    ParticipantStudyLookupResponse,
    ParticipantLoginRequest,
    ParticipantSubmissionCreate,
    ParticipantSubmissionDetailResponse,
    ParticipantSubmissionListItemResponse,
)
from app.services.participant_service import (
    authenticate_participant,
    build_participant_context,
    create_participant_access_token,
    create_participant_submission,
    get_participant_submission_for_current_participant,
    get_public_study_by_code,
    list_participant_submissions_for_current_participant,
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