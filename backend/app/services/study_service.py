from math import ceil

from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.study import (
    Study,
    StudyParameter,
    StudyStatus,
    StudyType,
)
from app.models.user import User, UserRole
from app.schemas.study import SortOrder, StudyCreate, StudySortBy, StudyUpdate


def generate_next_study_code(db: Session) -> str:
    next_number = db.execute(
        text("SELECT nextval('study_code_seq')")
    ).scalar_one()

    return f"VS-{next_number:03d}"


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

    try:
        db.add(study)
        db.commit()
        db.refresh(study)
    except IntegrityError:
        db.rollback()
        raise

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

def get_study_by_id_for_current_user(
    db: Session,
    study_id: int,
    current_user: User,
) -> Study | None:
    stmt = select(Study).options(selectinload(Study.parameters)).where(Study.id == study_id)

    if current_user.role == UserRole.RESEARCHER:
        stmt = stmt.where(Study.researcher_id == current_user.id)

    return db.execute(stmt).scalar_one_or_none()


def update_study_for_current_user(
    db: Session,
    study_id: int,
    current_user: User,
    payload: StudyUpdate,
) -> Study | None:
    study = get_study_by_id_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        return None

    data = payload.model_dump(exclude_unset=True)

    if "title" in data:
        study.title = data["title"]

    if "start_date" in data:
        study.start_date = data["start_date"]

    if "study_type" in data:
        study.study_type = data["study_type"]

    if "data_entry_mode" in data:
        study.data_entry_mode = data["data_entry_mode"]

    if "status" in data:
        study.status = data["status"]

    if "description" in data:
        study.description = data["description"]

    if "parameters" in data:
        study.parameters.clear()

        for parameter in payload.parameters or []:
            study.parameters.append(
                StudyParameter(
                    parameter_key=parameter.parameter_key,
                    measurement_frequency=parameter.measurement_frequency,
                )
            )

    try:
        db.add(study)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise

    return get_study_by_id_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )


def delete_study_for_current_user(
    db: Session,
    study_id: int,
    current_user: User,
) -> bool:
    study = get_study_by_id_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        return False

    try:
        db.delete(study)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise

    return True

def list_studies_for_current_user(
    db: Session,
    current_user: User,
    page: int,
    page_size: int,
    search: str | None = None,
    status: StudyStatus | None = None,
    study_type: StudyType | None = None,
    sort_by: StudySortBy = StudySortBy.CREATED_AT,
    sort_order: SortOrder = SortOrder.DESC,
):
    filters = []

    if current_user.role == UserRole.RESEARCHER:
        filters.append(Study.researcher_id == current_user.id)

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

    sort_columns = {
        StudySortBy.CREATED_AT: Study.created_at,
        StudySortBy.TITLE: Study.title,
    }
    
    sort_column = sort_columns[sort_by]
    order_clause = sort_column.asc() if sort_order == SortOrder.ASC else sort_column.desc()

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