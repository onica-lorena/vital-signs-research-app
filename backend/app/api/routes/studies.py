from datetime import datetime, timezone
from typing import Annotated
import csv
from io import StringIO

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.study import StudyStatus, StudyType
from app.models.user import User, UserRole
from app.schemas.study import (
    SortOrder,
    StudyAdminListItemResponse,
    StudyAdminListResponse,
    StudyAdminOverviewResponse,
    StudyCreate,
    StudyDetailResponse,
    StudyListItemResponse,
    StudyListResponse,
    StudySortBy,
    StudySummaryResponse,
    StudyUpdate,
)
from app.services.participant_service import (
    get_participants_summary_for_study,
    get_study_data_summary,
)
from app.services.study_service import (
    create_study as create_study_service,
    delete_study_for_current_user,
    get_studies_summary_for_user,
    get_study_admin_overview_by_id,
    get_study_by_id_for_current_user,
    list_studies_for_current_user,
    list_studies_for_admin_overview,
    update_study_for_current_user,
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
    sort_by: StudySortBy = Query(StudySortBy.CREATED_AT),
    sort_order: SortOrder = Query(SortOrder.DESC),
):
    items, total, total_pages = list_studies_for_current_user(
        db=db,
        current_user=current_user,
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


@router.get(
    "/admin-overview",
    response_model=StudyAdminListResponse,
    summary="Listează studiile pentru administrare tehnică",
)
def list_studies_admin_overview(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    status: StudyStatus | None = Query(None),
    study_type: StudyType | None = Query(None),
    sort_by: StudySortBy = Query(StudySortBy.CREATED_AT),
    sort_order: SortOrder = Query(SortOrder.DESC),
):
    items, total, total_pages = list_studies_for_admin_overview(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        study_type=study_type,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return StudyAdminListResponse(
        items=[StudyAdminListItemResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/admin-overview/{study_id}",
    response_model=StudyAdminOverviewResponse,
    summary="Detalii administrative studiu",
)
def read_study_admin_overview(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_role(UserRole.ADMIN))],
):
    study = get_study_admin_overview_by_id(
        db=db,
        study_id=study_id,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    return StudyAdminOverviewResponse.model_validate(study)


@router.get("/{study_id}/export", summary="Exportă datele esențiale ale studiului")
def export_study(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
    export_format: str = Query("json", alias="format", pattern="^(json|csv)$"),
):
    study = get_study_by_id_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    participants_summary = get_participants_summary_for_study(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    data_summary = get_study_data_summary(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    payload = {
        "exported_at": datetime.now(timezone.utc),
        "study": StudyDetailResponse.model_validate(study).model_dump(mode="json"),
        "participants_summary": participants_summary,
        "data_summary": data_summary,
    }
    
    if export_format == "csv":
        output = StringIO()
        output.write("\ufeff")

        writer = csv.writer(output, delimiter=";")

        writer.writerow([
            "ID studiu",
            "Titlu",
            "Cod",
            "Descriere",
            "Tip studiu",
            "Mod colectare",
            "Status",
            "Data început",
            "Data final",
            "Instituție",
            "Țintă participanți",
            "Participanți curenți",
            "Cercetător",
            "Email cercetător",
            "Total participanți",
            "Invitați",
            "Activi",
            "Suspendați",
            "Finalizați",
            "Retrăși",
            "Total trimiteri",
            "Total valori",
            "Trimise",
            "Validate",
            "Respinse",
            "Ultima trimitere",
            "Parametri monitorizați",
            "Reguli colectare",
            "Criterii includere",
            "Note administrative",
        ])

        study_data = payload["study"]
        researcher = study_data.get("researcher") or {}
        parameters = study_data.get("parameters", [])

        parameters_text = "; ".join(
            f"{parameter.get('parameter_key')} ({parameter.get('measurement_frequency')})"
            for parameter in parameters
        )

        writer.writerow([
            study_data.get("id"),
            study_data.get("title"),
            study_data.get("code"),
            study_data.get("description"),
            study_data.get("study_type"),
            study_data.get("data_entry_mode"),
            study_data.get("status"),
            study_data.get("start_date"),
            study_data.get("end_date"),
            study_data.get("institution"),
            study_data.get("target_participants"),
            study_data.get("participants_count"),
            researcher.get("full_name"),
            researcher.get("email"),
            participants_summary.get("total_participants"),
            participants_summary.get("invited_participants"),
            participants_summary.get("active_participants"),
            participants_summary.get("suspended_participants"),
            participants_summary.get("completed_participants"),
            participants_summary.get("withdrawn_participants"),
            data_summary.get("total_submissions"),
            data_summary.get("total_values"),
            data_summary.get("submitted_count"),
            data_summary.get("validated_count"),
            data_summary.get("rejected_count"),
            data_summary.get("last_submission_at"),
            parameters_text,
            study_data.get("collection_rules"),
            study_data.get("inclusion_criteria"),
            study_data.get("administrative_notes"),
        ])

        filename = f"{study.code.lower()}-export.csv"
        output.seek(0)

        return Response(
            content=output.getvalue(),
            media_type="text/csv; charset=utf-8-sig",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            },
        )
    
    filename = f"{study.code.lower()}-export.json"

    return JSONResponse(
        content=jsonable_encoder(payload),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


@router.get("/{study_id}", response_model=StudyDetailResponse, summary="Detalii studiu")
def get_study_by_id(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    study = get_study_by_id_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    return StudyDetailResponse.model_validate(study)


@router.patch("/{study_id}", response_model=StudyDetailResponse, summary="Actualizează studiu")
def update_study(
    study_id: int,
    payload: StudyUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        study = update_study_for_current_user(
            db=db,
            study_id=study_id,
            current_user=current_user,
            payload=payload,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    return StudyDetailResponse.model_validate(study)


@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Șterge studiu")
def delete_study(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_role(UserRole.RESEARCHER))],
):
    try:
        deleted = delete_study_for_current_user(
            db=db,
            study_id=study_id,
            current_user=current_user,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    return Response(status_code=status.HTTP_204_NO_CONTENT)