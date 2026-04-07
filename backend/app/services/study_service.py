from math import ceil

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.study import (
    DataEntryMode,
    MeasurementFrequency,
    Study,
    StudyParameter,
    StudyParameterKey,
    StudyStatus,
    StudyType,
)
from app.schemas.study import StudyCreate


def generate_next_study_code(db: Session) -> str:
    stmt = select(Study.code).order_by(Study.id.desc()).limit(1)
    last_code = db.execute(stmt).scalar_one_or_none()

    if not last_code:
        return "VS-001"

    try:
        numeric_part = int(last_code.split("-")[-1])
    except (ValueError, IndexError):
        numeric_part = 0

    return f"VS-{numeric_part + 1:03d}"


def create_study(db: Session, researcher_id: int, payload: StudyCreate) -> Study:
    study = Study(
        title=payload.title,
        code=generate_next_study_code(db),
        description=payload.description,
        study_type=payload.study_type,
        data_entry_mode=payload.data_entry_mode,
        status=payload.status,
        start_date=payload.start_date,
        participants_count=0,
        researcher_id=researcher_id,
    )

    for parameter in payload.parameters:
        study.parameters.append(
            StudyParameter(
                parameter_key=parameter.parameter_key,
                measurement_frequency=parameter.measurement_frequency,
            )
        )

    db.add(study)
    db.commit()
    db.refresh(study)

    return db.execute(
        select(Study)
        .options(selectinload(Study.parameters))
        .where(Study.id == study.id)
    ).scalar_one()


def get_study_by_id_for_user(db: Session, study_id: int, researcher_id: int) -> Study | None:
    stmt = (
        select(Study)
        .options(selectinload(Study.parameters))
        .where(Study.id == study_id, Study.researcher_id == researcher_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def list_studies_for_user(
    db: Session,
    researcher_id: int,
    page: int,
    page_size: int,
    search: str | None = None,
    status: StudyStatus | None = None,
    study_type: StudyType | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    filters = [Study.researcher_id == researcher_id]

    if search:
        search_term = f"%{search.strip()}%"
        filters.append(
            or_(
                Study.title.ilike(search_term),
                Study.code.ilike(search_term),
            )
        )

    if status:
        filters.append(Study.status == status)

    if study_type:
        filters.append(Study.study_type == study_type)

    count_stmt = select(func.count()).select_from(Study).where(*filters)
    total = db.execute(count_stmt).scalar_one()

    sort_column = Study.created_at if sort_by == "created_at" else Study.title
    if sort_order == "asc":
        order_clause = sort_column.asc()
    else:
        order_clause = sort_column.desc()

    stmt = (
        select(Study)
        .where(*filters)
        .order_by(order_clause)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(db.execute(stmt).scalars().all())
    total_pages = ceil(total / page_size) if total > 0 else 1

    return items, total, total_pages


def get_studies_summary_for_user(db: Session, researcher_id: int):
    total_studies = db.execute(
        select(func.count()).select_from(Study).where(Study.researcher_id == researcher_id)
    ).scalar_one()

    active_studies = db.execute(
        select(func.count()).select_from(Study).where(
            Study.researcher_id == researcher_id,
            Study.status == StudyStatus.ACTIVE,
        )
    ).scalar_one()

    studies_in_analysis = db.execute(
        select(func.count()).select_from(Study).where(
            Study.researcher_id == researcher_id,
            Study.status == StudyStatus.IN_ANALYSIS,
        )
    ).scalar_one()

    completed_studies = db.execute(
        select(func.count()).select_from(Study).where(
            Study.researcher_id == researcher_id,
            Study.status == StudyStatus.COMPLETED,
        )
    ).scalar_one()

    distribution_stmt = (
        select(Study.study_type, func.count())
        .where(Study.researcher_id == researcher_id)
        .group_by(Study.study_type)
        .order_by(Study.study_type.asc())
    )

    distribution_rows = db.execute(distribution_stmt).all()

    distribution = [
        {"study_type": row[0], "count": row[1]}
        for row in distribution_rows
    ]

    return {
        "total_studies": total_studies,
        "active_studies": active_studies,
        "studies_in_analysis": studies_in_analysis,
        "completed_studies": completed_studies,
        "study_type_distribution": distribution,
    }