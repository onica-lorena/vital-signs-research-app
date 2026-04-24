from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.report import StudyReportResponse
from app.services.report_service import build_report_pdf, build_study_report

router = APIRouter(
    prefix="/studies/{study_id}/reports",
    tags=["Reports"],
)


@router.post("/generate", response_model=StudyReportResponse)
def generate_study_report(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN)),
    ],
):
    try:
        return build_study_report(
            db=db,
            study_id=study_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/latest", response_model=StudyReportResponse)
def read_latest_study_report(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN)),
    ],
):
    try:
        return build_study_report(
            db=db,
            study_id=study_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc


@router.get("/export/pdf")
def export_study_report_pdf(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER, UserRole.ADMIN)),
    ],
):
    try:
        report = build_study_report(
            db=db,
            study_id=study_id,
            current_user=current_user,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    pdf = build_report_pdf(report)

    filename = f"{report.study.code.lower()}-raport.pdf"

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )