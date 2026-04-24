from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.analysis import AnalysisResult
from app.models.user import User, UserRole
from app.schemas.analysis import (
    AnalysisResultResponse,
    AnalysisRunRequest,
    AnalysisRunResponse,
)
from app.services.ml_prediction_service import run_analysis_for_study
from app.services.participant_service import get_study_for_current_user


router = APIRouter(
    prefix="/studies/{study_id}/analysis",
    tags=["Analysis"],
)


@router.post("/run", response_model=AnalysisRunResponse)
def run_study_analysis(
    study_id: int,
    payload: AnalysisRunRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN)),
    ],
):
    try:
        results = run_analysis_for_study(
            db=db,
            study_id=study_id,
            current_user=current_user,
            participant_id=payload.participant_id,
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

    return AnalysisRunResponse(
        message="Analiza a fost finalizată cu succes.",
        results=[AnalysisResultResponse.model_validate(item) for item in results],
    )


@router.get("/results", response_model=list[AnalysisResultResponse])
def read_analysis_results(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN)),
    ],
    participant_id: int | None = Query(None),
):
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    filters = [AnalysisResult.study_id == study_id]

    if participant_id is not None:
        filters.append(AnalysisResult.participant_id == participant_id)

    stmt = (
        select(AnalysisResult)
        .where(*filters)
        .order_by(AnalysisResult.created_at.desc())
    )

    results = list(db.execute(stmt).scalars().all())

    return [AnalysisResultResponse.model_validate(item) for item in results]