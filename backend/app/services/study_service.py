from datetime import datetime, timezone
from math import ceil

from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.participant import ParticipantSubmission, StudyParticipant
from app.models.study import Study, StudyParameter, StudyStatus, StudyType
from app.models.user import User, UserRole
from app.schemas.study import SortOrder, StudyCreate, StudySortBy, StudyUpdate


def _study_detail_options():
    return (
        selectinload(Study.parameters),
        selectinload(Study.researcher),
    )


def _validate_study_date_interval(start_date, end_date) -> None:
    if start_date is not None and end_date is not None and end_date < start_date:
        raise ValueError("Data de finalizare trebuie să fie după data de început.")


def generate_next_study_code(db: Session) -> str:
    next_number = db.execute(
        text("SELECT nextval('study_code_seq')")
    ).scalar_one()

    return f"VS-{next_number:03d}"


def create_study(db: Session, researcher_id: int, payload: StudyCreate) -> Study:
    _validate_study_date_interval(payload.start_date, payload.end_date)

    study = Study(
        title=payload.title,
        code=generate_next_study_code(db),
        description=payload.description,
        study_type=payload.study_type,
        data_entry_mode=payload.data_entry_mode,
        status=payload.status,
        start_date=payload.start_date,
        end_date=payload.end_date,
        institution=payload.institution,
        target_participants=payload.target_participants,
        collection_rules=payload.collection_rules,
        inclusion_criteria=payload.inclusion_criteria,
        administrative_notes=payload.administrative_notes,
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
        .options(*_study_detail_options())
        .where(Study.id == study.id)
    ).scalar_one()


def get_study_by_id_for_user(db: Session, study_id: int, researcher_id: int) -> Study | None:
    stmt = (
        select(Study)
        .options(*_study_detail_options())
        .where(Study.id == study_id, Study.researcher_id == researcher_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_study_by_id_for_current_user(
    db: Session,
    study_id: int,
    current_user: User,
) -> Study | None:
    if current_user.role != UserRole.RESEARCHER:
        return None

    stmt = (
        select(Study)
        .options(*_study_detail_options())
        .where(
            Study.id == study_id,
            Study.researcher_id == current_user.id,
        )
    )

    return db.execute(stmt).scalar_one_or_none()

def get_study_admin_overview_by_id(
    db: Session,
    study_id: int,
) -> Study | None:
    stmt = (
        select(Study)
        .options(selectinload(Study.researcher))
        .where(Study.id == study_id)
    )

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

    if "parameters" in data:
        submissions_count = db.execute(
            select(func.count())
            .select_from(ParticipantSubmission)
            .where(ParticipantSubmission.study_id == study.id)
        ).scalar_one()

        if submissions_count > 0:
            raise ValueError(
                "Parametrii studiului nu mai pot fi modificați după ce există date trimise de participanți."
            )

        study.parameters.clear()

        for parameter in payload.parameters or []:
            study.parameters.append(
                StudyParameter(
                    parameter_key=parameter.parameter_key,
                    measurement_frequency=parameter.measurement_frequency,
                )
            )

    if "title" in data:
        study.title = data["title"]

    if "start_date" in data:
        study.start_date = data["start_date"]

    if "end_date" in data:
        study.end_date = data["end_date"]

    if "study_type" in data:
        study.study_type = data["study_type"]

    if "data_entry_mode" in data and data["data_entry_mode"] != study.data_entry_mode:
        submissions_count = db.execute(
            select(func.count())
            .select_from(ParticipantSubmission)
            .where(ParticipantSubmission.study_id == study.id)
        ).scalar_one()

        locked_participants_count = db.execute(
            select(func.count())
            .select_from(StudyParticipant)
            .where(
                StudyParticipant.study_id == study.id,
                StudyParticipant.selected_data_entry_method.is_not(None),
            )
        ).scalar_one()

        if submissions_count > 0 or locked_participants_count > 0:
            raise ValueError(
                "Modul de furnizare a datelor nu mai poate fi modificat după ce participanții au ales metoda sau au trimis deja date."
            )

        study.data_entry_mode = data["data_entry_mode"]

    if "status" in data:
        study.status = data["status"]

    if "description" in data:
        study.description = data["description"]

    if "institution" in data:
        study.institution = data["institution"]

    if "target_participants" in data:
        study.target_participants = data["target_participants"]

    if "collection_rules" in data:
        study.collection_rules = data["collection_rules"]

    if "inclusion_criteria" in data:
        study.inclusion_criteria = data["inclusion_criteria"]

    if "administrative_notes" in data:
        study.administrative_notes = data["administrative_notes"]

    _validate_study_date_interval(study.start_date, study.end_date)

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

    if study.status != StudyStatus.DRAFT:
        raise ValueError("Doar studiile aflate în starea de ciornă pot fi șterse.")

    participants_count = db.execute(
        select(func.count())
        .select_from(StudyParticipant)
        .where(StudyParticipant.study_id == study.id)
    ).scalar_one()

    if participants_count > 0:
        raise ValueError("Studiul are participanți înregistrați și nu mai poate fi șters.")

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
    if current_user.role != UserRole.RESEARCHER:
        return [], 0, 1

    filters = [Study.researcher_id == current_user.id]

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


def list_studies_for_admin_overview(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    status: StudyStatus | None = None,
    study_type: StudyType | None = None,
    sort_by: StudySortBy = StudySortBy.CREATED_AT,
    sort_order: SortOrder = SortOrder.DESC,
):
    filters = []

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
        .options(selectinload(Study.researcher))
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

def _add_months(year: int, month: int, offset: int) -> tuple[int, int]:
    month_index = year * 12 + (month - 1) + offset
    new_year = month_index // 12
    new_month = month_index % 12 + 1
    return new_year, new_month


def get_studies_admin_summary(db: Session) -> dict:
    grouped_rows = db.execute(
        select(Study.status, func.count())
        .group_by(Study.status)
    ).all()

    grouped = {row[0]: row[1] for row in grouped_rows}

    draft = grouped.get(StudyStatus.DRAFT, 0)
    active = grouped.get(StudyStatus.ACTIVE, 0)
    in_analysis = grouped.get(StudyStatus.IN_ANALYSIS, 0)
    completed = grouped.get(StudyStatus.COMPLETED, 0)

    now = datetime.now(timezone.utc)

    month_starts = []
    for offset in range(-5, 1):
        year, month = _add_months(now.year, now.month, offset)
        month_starts.append(datetime(year, month, 1, tzinfo=timezone.utc))

    start_date = month_starts[0]

    monthly_rows = db.execute(
        select(
            func.date_trunc("month", Study.created_at).label("month"),
            func.count().label("studies_count"),
        )
        .where(Study.created_at >= start_date)
        .group_by("month")
        .order_by("month")
    ).all()

    monthly_map: dict[str, int] = {}

    for month_value, studies_count in monthly_rows:
        if month_value.tzinfo is None:
            month_value = month_value.replace(tzinfo=timezone.utc)

        key = month_value.strftime("%Y-%m")
        monthly_map[key] = studies_count

    monthly_studies = [
        {
            "month": month_start.strftime("%Y-%m"),
            "studies_count": monthly_map.get(month_start.strftime("%Y-%m"), 0),
        }
        for month_start in month_starts
    ]

    return {
        "total_studies": draft + active + in_analysis + completed,
        "draft_studies": draft,
        "active_studies": active,
        "studies_in_analysis": in_analysis,
        "completed_studies": completed,
        "monthly_studies": monthly_studies,
    }