from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.study import StudyStatus, StudyType
from app.models.user import User, UserRole
from app.schemas.study import (
    StudyCreate,
    StudyDetailResponse,
    StudyListItemResponse,
    StudyListResponse,
    StudySummaryResponse,
)
from app.services.study_service import (
    create_study as create_study_service,
    get_studies_summary_for_user,
    get_study_by_id_for_user,
    list_studies_for_user,
)

router = APIRouter(prefix="/studies", tags=["Studies"])


@router.post(
    "/",
    response_model=StudyDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Creează studiu",
)
def create_study(
    payload: StudyCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    study = create_study_service(db, researcher_id=current_user.id, payload=payload)
    return StudyDetailResponse.model_validate(study)


@router.get("/", response_model=StudyListResponse, summary="Listează studiile")
def list_studies(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: StudyStatus | None = Query(None),
    study_type: StudyType | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
):
    items, total, total_pages = list_studies_for_user(
        db=db,
        researcher_id=current_user.id,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        study_type=study_type,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return StudyListResponse(
        items=[StudyListItemResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/summary", response_model=StudySummaryResponse, summary="Rezumat studii")
def get_studies_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    summary = get_studies_summary_for_user(db, researcher_id=current_user.id)
    return StudySummaryResponse(**summary)


@router.get("/{study_id}", response_model=StudyDetailResponse, summary="Detalii studiu")
def get_study_by_id(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    study = get_study_by_id_for_user(db, study_id=study_id, researcher_id=current_user.id)

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    return StudyDetailResponse.model_validate(study)