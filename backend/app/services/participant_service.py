from datetime import date, datetime, timedelta, timezone
from math import ceil

from sqlalchemy import func, or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.security import (
    create_access_token,
    generate_numeric_pin,
    get_password_hash,
    verify_password,
)
from app.models.participant import (
    ActivityLevel,
    MeasurementContext,
    ParticipantCondition,
    ParticipantConditionType,
    ParticipantDataEntryMethod,
    ParticipantSubmission,
    ParticipantSubmissionSession,
    ParticipantSubmissionStatus,
    ParticipantSubmissionValue,
    ParticipantStatus,
    ParticipantSex,
    StudyParticipant,
)
from app.models.study import DataEntryMode, Study, StudyStatus
from app.models.user import User, UserRole
from app.schemas.participant import (
    ParticipantBulkSubmissionCreate,
    ParticipantCreate,
    ParticipantHistoryStatus,
    ParticipantSortBy,
    SortOrder,
    ParticipantSubmissionCreate,
    ParticipantSubmissionUpdate,
    ParticipantUpdate,
)


def get_study_for_current_user(
    db: Session,
    study_id: int,
    current_user: User,
    *,
    load_parameters: bool = False,
) -> Study | None:
    stmt = select(Study)

    if load_parameters:
        stmt = stmt.options(selectinload(Study.parameters))

    stmt = stmt.where(Study.id == study_id)

    if current_user.role == UserRole.RESEARCHER:
        stmt = stmt.where(Study.researcher_id == current_user.id)
    else:
        return None

    return db.execute(stmt).scalar_one_or_none()


def get_participant_by_id(db: Session, participant_id: int) -> StudyParticipant | None:
    stmt = (
        select(StudyParticipant)
        .options(
            selectinload(StudyParticipant.study).selectinload(Study.parameters),
            selectinload(StudyParticipant.conditions),
        )
        .where(StudyParticipant.id == participant_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def _ensure_allowed_entry_method(
    participant: StudyParticipant,
    method: ParticipantDataEntryMethod,
) -> None:
    study_mode = participant.study.data_entry_mode

    if study_mode == DataEntryMode.MANUAL:
        if method != ParticipantDataEntryMethod.MANUAL:
            raise ValueError("Acest studiu permite doar introducerea manuală a datelor.")
        return

    if study_mode == DataEntryMode.CSV:
        if method != ParticipantDataEntryMethod.CSV:
            raise ValueError("Acest studiu permite doar încărcarea datelor prin CSV.")
        return

    if study_mode == DataEntryMode.MANUAL_CSV:
        if participant.selected_data_entry_method is None:
            participant.selected_data_entry_method = method
            return

        if participant.selected_data_entry_method != method:
            raise ValueError("Metoda de furnizare a fost deja aleasă și nu mai poate fi schimbată.")
        

def _validate_submission_values_against_study(
    participant: StudyParticipant,
    values,
) -> None:
    allowed_parameters = {parameter.parameter_key for parameter in participant.study.parameters}
    submitted_parameters = {item.parameter_key for item in values}

    invalid_parameters = submitted_parameters - allowed_parameters
    if invalid_parameters:
        raise ValueError("Ai trimis parametri care nu fac parte din configurația studiului.")

    missing_parameters = allowed_parameters - submitted_parameters
    if missing_parameters:
        raise ValueError("Trebuie să trimiți toate valorile configurate pentru acest studiu.")        


def generate_next_participant_code_for_study(db: Session, study_id: int) -> str:
    max_code_number = db.execute(
        text(
            """
            SELECT MAX(CAST(SUBSTRING(participant_code FROM '([0-9]+)$') AS INTEGER))
            FROM study_participants
            WHERE study_id = :study_id
            """
        ),
        {"study_id": study_id},
    ).scalar()

    next_number = 1 if max_code_number is None else max_code_number + 1
    return f"P-{next_number:03d}"


def _replace_participant_conditions(
    participant: StudyParticipant,
    conditions,
) -> None:
    participant.conditions.clear()

    for condition in conditions or []:
        participant.conditions.append(
            ParticipantCondition(
                condition_type=condition.condition_type,
                notes=condition.notes,
            )
        )


def create_study_participant(
    db: Session,
    study_id: int,
    current_user: User,
    payload: ParticipantCreate,
) -> tuple[StudyParticipant, str]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
        load_parameters=False,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    participant_code = generate_next_participant_code_for_study(db, study_id)
    participant_identifier = payload.participant_identifier or participant_code

    existing_identifier = db.execute(
        select(StudyParticipant.id).where(
            StudyParticipant.study_id == study_id,
            StudyParticipant.participant_identifier == participant_identifier,
        )
    ).scalar_one_or_none()

    if existing_identifier is not None:
        raise ValueError("Există deja un participant cu acest identificator în cadrul studiului.")

    temporary_pin = payload.pin or generate_numeric_pin(6)

    participant = StudyParticipant(
        study_id=study_id,
        participant_code=participant_code,
        full_name=payload.full_name,
        participant_identifier=participant_identifier,
        birth_date=payload.birth_date,
        sex=payload.sex,
        participant_group=payload.participant_group,
        activity_level=payload.activity_level,
        status=ParticipantStatus.INVITED,
        pin_hash=get_password_hash(temporary_pin),
        access_version=1,
        submissions_count=0,
        notes=payload.notes,
    )

    _replace_participant_conditions(participant, payload.conditions)

    study.participants_count = (study.participants_count or 0) + 1

    try:
        db.add(participant)
        db.add(study)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Nu s-a putut crea participantul. Verifică datele introduse.")

    created_participant = get_participant_by_id(db, participant.id)
    if created_participant is None:
        raise LookupError("Participantul creat nu a mai putut fi încărcat.")

    return created_participant, temporary_pin


def create_study_participants_bulk(
    db: Session,
    study_id: int,
    current_user: User,
    payloads: list[ParticipantCreate],
) -> list[tuple[StudyParticipant, str]]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
        load_parameters=False,
    )

    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    if not payloads:
        raise ValueError("Lista de participanți nu poate fi goală.")

    created_items: list[tuple[StudyParticipant, str]] = []

    existing_identifiers = set(
        db.execute(
            select(StudyParticipant.participant_identifier).where(
                StudyParticipant.study_id == study_id
            )
        ).scalars().all()
    )

    identifiers_from_payload: set[str] = set()

    max_code_number = db.execute(
        text(
            """
            SELECT MAX(CAST(SUBSTRING(participant_code FROM '([0-9]+)$') AS INTEGER))
            FROM study_participants
            WHERE study_id = :study_id
            """
        ),
        {"study_id": study_id},
    ).scalar()

    next_number = 1 if max_code_number is None else max_code_number + 1

    try:
        for payload in payloads:
            participant_code = f"P-{next_number:03d}"
            next_number += 1

            participant_identifier = payload.participant_identifier or participant_code

            if participant_identifier in existing_identifiers:
                raise ValueError(
                    f"Există deja un participant cu identificatorul {participant_identifier}."
                )

            if participant_identifier in identifiers_from_payload:
                raise ValueError(
                    f"Identificatorul {participant_identifier} apare de mai multe ori în fișier."
                )

            identifiers_from_payload.add(participant_identifier)

            temporary_pin = payload.pin or generate_numeric_pin(6)

            participant = StudyParticipant(
                study_id=study_id,
                participant_code=participant_code,
                full_name=payload.full_name,
                participant_identifier=participant_identifier,
                birth_date=payload.birth_date,
                sex=payload.sex,
                participant_group=payload.participant_group,
                activity_level=payload.activity_level,
                status=ParticipantStatus.INVITED,
                pin_hash=get_password_hash(temporary_pin),
                access_version=1,
                submissions_count=0,
                notes=payload.notes,
            )

            _replace_participant_conditions(participant, payload.conditions)

            db.add(participant)
            created_items.append((participant, temporary_pin))

        study.participants_count = (study.participants_count or 0) + len(created_items)
        db.add(study)
        db.commit()

    except IntegrityError:
        db.rollback()
        raise ValueError("Nu s-au putut crea participanții. Verifică datele introduse.")

    except Exception:
        db.rollback()
        raise

    refreshed_items: list[tuple[StudyParticipant, str]] = []

    for participant, temporary_pin in created_items:
        refreshed = get_participant_by_id(db, participant.id)

        if refreshed is None:
            raise LookupError("Un participant creat nu a mai putut fi încărcat.")

        refreshed_items.append((refreshed, temporary_pin))

    return refreshed_items


def list_study_participants(
    db: Session,
    study_id: int,
    current_user: User,
    page: int,
    page_size: int,
    search: str | None = None,
    status: ParticipantStatus | None = None,
    sex: ParticipantSex | None = None,
    activity_level: ActivityLevel | None = None,
    participant_group: str | None = None,
    only_with_submissions: bool = False,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> tuple[list[StudyParticipant], int, int]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    filters = [StudyParticipant.study_id == study_id]

    if search:
        search_term = f"%{search.strip()}%"
        filters.append(
            or_(
                StudyParticipant.full_name.ilike(search_term),
                StudyParticipant.participant_code.ilike(search_term),
                StudyParticipant.participant_identifier.ilike(search_term),
            )
        )

    if status is not None:
        filters.append(StudyParticipant.status == status)

    if sex is not None:
        filters.append(StudyParticipant.sex == sex)

    if activity_level is not None:
        filters.append(StudyParticipant.activity_level == activity_level)

    if participant_group:
        filters.append(StudyParticipant.participant_group.ilike(f"%{participant_group.strip()}%"))

    if only_with_submissions:
        filters.append(StudyParticipant.submissions_count > 0)

    total = db.execute(
        select(func.count()).select_from(StudyParticipant).where(*filters)
    ).scalar_one()

    sort_columns = {
        ParticipantSortBy.CREATED_AT: StudyParticipant.created_at,
        ParticipantSortBy.FULL_NAME: StudyParticipant.full_name,
        ParticipantSortBy.PARTICIPANT_CODE: StudyParticipant.participant_code,
        ParticipantSortBy.SUBMISSIONS_COUNT: StudyParticipant.submissions_count,
        ParticipantSortBy.LAST_LOGIN_AT: StudyParticipant.last_login_at,
        ParticipantSortBy.LAST_SUBMISSION_AT: StudyParticipant.last_submission_at,
    }

    sort_column = sort_columns[sort_by]

    if sort_order == SortOrder.ASC:
        order_clause = sort_column.asc().nulls_last()
    else:
        order_clause = sort_column.desc().nulls_last()

    stmt = (
        select(StudyParticipant)
        .where(*filters)
        .order_by(order_clause, StudyParticipant.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(db.execute(stmt).scalars().all())
    total_pages = ceil(total / page_size) if total > 0 else 1

    return items, total, total_pages


def get_participants_summary_for_study(
    db: Session,
    study_id: int,
    current_user: User,
) -> dict:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    total_participants = db.execute(
        select(func.count()).select_from(StudyParticipant).where(
            StudyParticipant.study_id == study_id
        )
    ).scalar_one()

    grouped_rows = db.execute(
        select(StudyParticipant.status, func.count())
        .where(StudyParticipant.study_id == study_id)
        .group_by(StudyParticipant.status)
    ).all()

    grouped = {row[0]: row[1] for row in grouped_rows}

    return {
        "total_participants": total_participants,
        "invited_participants": grouped.get(ParticipantStatus.INVITED, 0),
        "active_participants": grouped.get(ParticipantStatus.ACTIVE, 0),
        "suspended_participants": grouped.get(ParticipantStatus.SUSPENDED, 0),
        "completed_participants": grouped.get(ParticipantStatus.COMPLETED, 0),
        "withdrawn_participants": grouped.get(ParticipantStatus.WITHDRAWN, 0),
    }


def get_study_participant_for_current_user(
    db: Session,
    study_id: int,
    participant_id: int,
    current_user: User,
) -> StudyParticipant | None:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    stmt = (
        select(StudyParticipant)
        .options(
            selectinload(StudyParticipant.study).selectinload(Study.parameters),
            selectinload(StudyParticipant.conditions),
        )
        .where(
            StudyParticipant.id == participant_id,
            StudyParticipant.study_id == study_id,
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def update_study_participant_for_current_user(
    db: Session,
    study_id: int,
    participant_id: int,
    current_user: User,
    payload: ParticipantUpdate,
) -> StudyParticipant | None:
    participant = get_study_participant_for_current_user(
        db=db,
        study_id=study_id,
        participant_id=participant_id,
        current_user=current_user,
    )

    if participant is None:
        return None

    data = payload.model_dump(exclude_unset=True)

    if "participant_identifier" in data and data["participant_identifier"] is not None:
        existing_identifier = db.execute(
            select(StudyParticipant.id).where(
                StudyParticipant.study_id == study_id,
                StudyParticipant.participant_identifier == data["participant_identifier"],
                StudyParticipant.id != participant.id,
            )
        ).scalar_one_or_none()

        if existing_identifier is not None:
            raise ValueError("Există deja un participant cu acest identificator în cadrul studiului.")

    previous_status = participant.status

    if "full_name" in data and data["full_name"] is not None:
        participant.full_name = data["full_name"]

    if "participant_identifier" in data and data["participant_identifier"] is not None:
        participant.participant_identifier = data["participant_identifier"]

    if "birth_date" in data:
        participant.birth_date = data["birth_date"]

    if "sex" in data:
        participant.sex = data["sex"]

    if "participant_group" in data:
        participant.participant_group = data["participant_group"]

    if "activity_level" in data:
        participant.activity_level = data["activity_level"]

    if "status" in data and data["status"] is not None:
        participant.status = data["status"]

    if "notes" in data:
        participant.notes = data["notes"]

    if "conditions" in data:
        _replace_participant_conditions(participant, payload.conditions)

    if participant.status != previous_status and participant.status in {
        ParticipantStatus.SUSPENDED,
        ParticipantStatus.WITHDRAWN,
    }:
        participant.access_version += 1

    try:
        db.add(participant)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("Nu s-au putut actualiza datele participantului.")

    return get_participant_by_id(db, participant.id)


def reset_study_participant_pin(
    db: Session,
    study_id: int,
    participant_id: int,
    current_user: User,
) -> tuple[StudyParticipant, str]:
    participant = get_study_participant_for_current_user(
        db=db,
        study_id=study_id,
        participant_id=participant_id,
        current_user=current_user,
    )

    if participant is None:
        raise LookupError("Participantul nu a fost găsit.")

    temporary_pin = generate_numeric_pin(6)
    participant.pin_hash = get_password_hash(temporary_pin)
    participant.access_version += 1

    db.add(participant)
    db.commit()

    updated_participant = get_participant_by_id(db, participant.id)
    if updated_participant is None:
        raise LookupError("Participantul nu a fost găsit după resetarea PIN-ului.")

    return updated_participant, temporary_pin


def get_public_study_by_code(db: Session, study_code: str) -> Study | None:
    stmt = (
        select(Study)
        .options(selectinload(Study.parameters))
        .where(Study.code == study_code)
    )
    return db.execute(stmt).scalar_one_or_none()


def authenticate_participant(
    db: Session,
    study_code: str,
    participant_code: str,
    pin: str,
) -> StudyParticipant:
    stmt = (
        select(StudyParticipant)
        .join(Study, Study.id == StudyParticipant.study_id)
        .options(
            selectinload(StudyParticipant.study).selectinload(Study.parameters),
        )
        .where(
            Study.code == study_code,
            StudyParticipant.participant_code == participant_code,
        )
    )

    participant = db.execute(stmt).scalar_one_or_none()

    if participant is None or not verify_password(pin, participant.pin_hash):
        raise ValueError("Codul participantului sau PIN-ul sunt incorecte.")

    if participant.study.status != StudyStatus.ACTIVE:
        raise ValueError("Studiul nu este disponibil pentru accesul participanților.")

    if participant.status in {
        ParticipantStatus.SUSPENDED,
        ParticipantStatus.WITHDRAWN,
    }:
        raise ValueError("Accesul participantului este restricționat. Contactează cercetătorul.")

    participant.last_login_at = datetime.now(timezone.utc)

    if participant.status == ParticipantStatus.INVITED:
        participant.status = ParticipantStatus.ACTIVE

    db.add(participant)
    db.commit()

    refreshed_participant = get_participant_by_id(db, participant.id)
    if refreshed_participant is None:
        raise LookupError("Participantul nu a mai putut fi încărcat după autentificare.")

    return refreshed_participant


def create_participant_access_token(participant: StudyParticipant) -> str:
    return create_access_token(
        subject=str(participant.id),
        extra_claims={
            "token_type": "participant",
            "study_id": participant.study_id,
            "access_version": participant.access_version,
        },
    )


def build_participant_context(participant: StudyParticipant) -> dict:
    study = participant.study

    return {
        "participant": {
            "id": participant.id,
            "participant_code": participant.participant_code,
            "full_name": participant.full_name,
            "status": participant.status,
            "submissions_count": participant.submissions_count,
            "last_login_at": participant.last_login_at,
            "last_submission_at": participant.last_submission_at,
            "selected_data_entry_method": participant.selected_data_entry_method,
            "birth_date": participant.birth_date,
            "sex": participant.sex,
            "participant_group": participant.participant_group,
            "activity_level": participant.activity_level,
        },
        "study": {
            "id": study.id,
            "code": study.code,
            "title": study.title,
            "status": study.status,
            "data_entry_mode": study.data_entry_mode,
        },
        "parameters": [
            {
                "parameter_key": parameter.parameter_key,
                "measurement_frequency": parameter.measurement_frequency,
            }
            for parameter in study.parameters
        ],
    }


def set_participant_data_entry_method(
    db: Session,
    participant: StudyParticipant,
    method: ParticipantDataEntryMethod,
) -> StudyParticipant:
    participant = get_participant_by_id(db, participant.id)
    if participant is None:
        raise LookupError("Participantul nu a fost găsit.")

    if participant.study.status != StudyStatus.ACTIVE:
        raise ValueError("Studiul nu este disponibil pentru alegerea metodei de furnizare.")

    if participant.status != ParticipantStatus.ACTIVE:
        raise ValueError("Doar participanții activi pot selecta metoda de furnizare.")

    if participant.study.data_entry_mode != DataEntryMode.MANUAL_CSV:
        raise ValueError("Acest studiu nu permite alegerea între mai multe metode de furnizare.")

    if (
        participant.selected_data_entry_method is not None
        and participant.selected_data_entry_method != method
    ):
        raise ValueError("Metoda de furnizare a fost deja aleasă și nu mai poate fi schimbată.")

    participant.selected_data_entry_method = method

    db.add(participant)
    db.commit()

    updated = get_participant_by_id(db, participant.id)
    if updated is None:
        raise LookupError("Participantul nu a mai putut fi încărcat.")

    return updated


def get_participant_submission_by_id(
    db: Session,
    submission_id: int,
) -> ParticipantSubmission | None:
    stmt = (
        select(ParticipantSubmission)
        .options(
            selectinload(ParticipantSubmission.values),
            selectinload(ParticipantSubmission.session),
        )
        .where(ParticipantSubmission.id == submission_id)
    )
    return db.execute(stmt).scalar_one_or_none()


def get_participant_submission_session_for_current_participant(
    db: Session,
    session_id: int,
    participant: StudyParticipant,
) -> ParticipantSubmissionSession | None:
    stmt = (
        select(ParticipantSubmissionSession)
        .options(
            selectinload(ParticipantSubmissionSession.submissions)
            .selectinload(ParticipantSubmission.values)
        )
        .where(
            ParticipantSubmissionSession.id == session_id,
            ParticipantSubmissionSession.participant_id == participant.id,
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def create_participant_submission(
    db: Session,
    participant: StudyParticipant,
    payload: ParticipantSubmissionCreate,
) -> ParticipantSubmission:
    participant = get_participant_by_id(db, participant.id)
    if participant is None:
        raise LookupError("Participantul nu a fost găsit.")

    if participant.study.status != StudyStatus.ACTIVE:
        raise ValueError("Studiul nu este activ și nu poate primi date noi.")

    if participant.status != ParticipantStatus.ACTIVE:
        raise ValueError("Doar participanții activi pot trimite date.")

    _ensure_allowed_entry_method(participant, ParticipantDataEntryMethod.MANUAL)
    _validate_submission_values_against_study(participant, payload.values)

    now = datetime.now(timezone.utc)
    measured_moments = [item.measured_at or now for item in payload.values]

    session = ParticipantSubmissionSession(
        study_id=participant.study_id,
        participant_id=participant.id,
        entry_method=ParticipantDataEntryMethod.MANUAL,
        source_file_name=None,
        records_count=1,
        interval_start=min(measured_moments),
        interval_end=max(measured_moments),
        measurement_context=payload.measurement_context,
    )

    submission = ParticipantSubmission(
        study_id=participant.study_id,
        participant_id=participant.id,
        session=session,
        entry_method=ParticipantDataEntryMethod.MANUAL,
        status=ParticipantSubmissionStatus.SUBMITTED,
        participant_notes=payload.participant_notes,
        review_notes=None,
        reviewed_at=None,
    )

    for item in payload.values:
        submission.values.append(
            ParticipantSubmissionValue(
                parameter_key=item.parameter_key,
                value=item.value,
                measured_at=item.measured_at or now,
            )
        )

    participant.submissions_count = (participant.submissions_count or 0) + 1
    participant.last_submission_at = now

    db.add(session)
    db.add(submission)
    db.add(participant)
    db.commit()

    created_submission = get_participant_submission_by_id(db, submission.id)
    if created_submission is None:
        raise LookupError("Înregistrarea creată nu a mai putut fi încărcată.")

    return created_submission


def create_bulk_participant_submissions(
    db: Session,
    participant: StudyParticipant,
    payload: ParticipantBulkSubmissionCreate,
) -> ParticipantSubmissionSession:
    participant = get_participant_by_id(db, participant.id)
    if participant is None:
        raise LookupError("Participantul nu a fost găsit.")

    if participant.study.status != StudyStatus.ACTIVE:
        raise ValueError("Studiul nu este activ și nu poate primi date noi.")

    if participant.status != ParticipantStatus.ACTIVE:
        raise ValueError("Doar participanții activi pot trimite date.")

    _ensure_allowed_entry_method(participant, ParticipantDataEntryMethod.CSV)

    now = datetime.now(timezone.utc)
    all_measured_moments: list[datetime] = []

    session = ParticipantSubmissionSession(
        study_id=participant.study_id,
        participant_id=participant.id,
        entry_method=ParticipantDataEntryMethod.CSV,
        source_file_name=payload.source_file_name,
        records_count=len(payload.submissions),
        measurement_context=payload.measurement_context,
    )

    for item in payload.submissions:
        _validate_submission_values_against_study(participant, item.values)

        row_moments = [value.measured_at or now for value in item.values]
        all_measured_moments.extend(row_moments)

        submission = ParticipantSubmission(
            study_id=participant.study_id,
            participant_id=participant.id,
            session=session,
            entry_method=ParticipantDataEntryMethod.CSV,
            status=ParticipantSubmissionStatus.SUBMITTED,
            participant_notes=payload.participant_notes,
            review_notes=None,
            reviewed_at=None,
        )

        for value in item.values:
            submission.values.append(
                ParticipantSubmissionValue(
                    parameter_key=value.parameter_key,
                    value=value.value,
                    measured_at=value.measured_at or now,
                )
            )

        db.add(submission)

    if all_measured_moments:
        session.interval_start = min(all_measured_moments)
        session.interval_end = max(all_measured_moments)

    participant.submissions_count = (participant.submissions_count or 0) + 1
    participant.last_submission_at = now

    db.add(session)
    db.add(participant)
    db.commit()

    created_session = get_participant_submission_session_for_current_participant(
        db=db,
        session_id=session.id,
        participant=participant,
    )
    if created_session is None:
        raise LookupError("Sesiunea creată nu a mai putut fi încărcată.")

    return created_session


def list_participant_submissions_for_current_participant(
    db: Session,
    participant: StudyParticipant,
) -> list[dict]:
    stmt = (
        select(ParticipantSubmission)
        .options(selectinload(ParticipantSubmission.values))
        .where(ParticipantSubmission.participant_id == participant.id)
        .order_by(ParticipantSubmission.submitted_at.desc())
    )

    submissions = list(db.execute(stmt).scalars().all())

    return [
        {
            "id": submission.id,
            "session_id": submission.session_id,
            "entry_method": submission.entry_method,
            "status": submission.status,
            "submitted_at": submission.submitted_at,
            "reviewed_at": submission.reviewed_at,
            "participant_notes": submission.participant_notes,
            "review_notes": submission.review_notes,
            "values_count": len(submission.values),
        }
        for submission in submissions
    ]


def get_participant_submission_for_current_participant(
    db: Session,
    submission_id: int,
    participant: StudyParticipant,
) -> ParticipantSubmission | None:
    stmt = (
        select(ParticipantSubmission)
        .options(
            selectinload(ParticipantSubmission.values),
            selectinload(ParticipantSubmission.session),
        )
        .where(
            ParticipantSubmission.id == submission_id,
            ParticipantSubmission.participant_id == participant.id,
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def list_participant_submissions_for_researcher(
    db: Session,
    study_id: int,
    participant_id: int,
    current_user: User,
) -> list[ParticipantSubmission]:
    participant = get_study_participant_for_current_user(
        db=db,
        study_id=study_id,
        participant_id=participant_id,
        current_user=current_user,
    )

    if participant is None:
        raise LookupError("Participantul nu a fost găsit.")

    stmt = (
        select(ParticipantSubmission)
        .options(selectinload(ParticipantSubmission.values))
        .where(
            ParticipantSubmission.study_id == study_id,
            ParticipantSubmission.participant_id == participant_id,
        )
        .order_by(ParticipantSubmission.submitted_at.desc())
    )

    return list(db.execute(stmt).scalars().all())

def get_study_submission_for_current_user(
    db: Session,
    study_id: int,
    submission_id: int,
    current_user: User,
) -> ParticipantSubmission | None:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    stmt = (
        select(ParticipantSubmission)
        .options(
            selectinload(ParticipantSubmission.values),
            selectinload(ParticipantSubmission.participant),
        )
        .where(
            ParticipantSubmission.id == submission_id,
            ParticipantSubmission.study_id == study_id,
        )
    )
    return db.execute(stmt).scalar_one_or_none()


def list_study_submissions(
    db: Session,
    study_id: int,
    current_user: User,
    page: int,
    page_size: int,
    search: str | None = None,
    status: ParticipantSubmissionStatus | None = None,
    participant_id: int | None = None,
) -> tuple[list[ParticipantSubmission], int, int]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    filters = [ParticipantSubmission.study_id == study_id]

    if participant_id is not None:
        filters.append(ParticipantSubmission.participant_id == participant_id)

    if status is not None:
        filters.append(ParticipantSubmission.status == status)

    if search:
        search_term = f"%{search.strip()}%"
        filters.append(
            or_(
                StudyParticipant.full_name.ilike(search_term),
                StudyParticipant.participant_code.ilike(search_term),
                StudyParticipant.participant_identifier.ilike(search_term),
            )
        )

    count_stmt = (
        select(func.count())
        .select_from(ParticipantSubmission)
        .join(StudyParticipant, StudyParticipant.id == ParticipantSubmission.participant_id)
        .where(*filters)
    )
    total = db.execute(count_stmt).scalar_one()

    stmt = (
        select(ParticipantSubmission)
        .join(StudyParticipant, StudyParticipant.id == ParticipantSubmission.participant_id)
        .options(
            selectinload(ParticipantSubmission.values),
            selectinload(ParticipantSubmission.participant),
        )
        .where(*filters)
        .order_by(ParticipantSubmission.submitted_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(db.execute(stmt).scalars().all())
    total_pages = ceil(total / page_size) if total > 0 else 1

    return items, total, total_pages


def update_study_submission_for_current_user(
    db: Session,
    study_id: int,
    submission_id: int,
    current_user: User,
    payload: ParticipantSubmissionUpdate,
) -> ParticipantSubmission | None:
    submission = get_study_submission_for_current_user(
        db=db,
        study_id=study_id,
        submission_id=submission_id,
        current_user=current_user,
    )

    if submission is None:
        return None

    data = payload.model_dump(exclude_unset=True)

    if "status" in data and data["status"] is not None:
        submission.status = data["status"]

        if submission.status in {
            ParticipantSubmissionStatus.VALIDATED,
            ParticipantSubmissionStatus.REJECTED,
        }:
            submission.reviewed_at = datetime.now(timezone.utc)
        elif submission.status == ParticipantSubmissionStatus.SUBMITTED:
            submission.reviewed_at = None

    if "review_notes" in data:
        submission.review_notes = data["review_notes"]

    db.add(submission)
    db.commit()

    return get_study_submission_for_current_user(
        db=db,
        study_id=study_id,
        submission_id=submission_id,
        current_user=current_user,
    )


def get_study_data_summary(
    db: Session,
    study_id: int,
    current_user: User,
) -> dict:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    sessions = list(
        db.execute(
            select(ParticipantSubmissionSession)
            .options(selectinload(ParticipantSubmissionSession.submissions))
            .where(ParticipantSubmissionSession.study_id == study_id)
        ).scalars().all()
    )

    total_sessions = len(sessions)
    total_records = sum(session.records_count or 0 for session in sessions)

    total_values = db.execute(
        select(func.count())
        .select_from(ParticipantSubmissionValue)
        .join(
            ParticipantSubmission,
            ParticipantSubmission.id == ParticipantSubmissionValue.submission_id,
        )
        .where(ParticipantSubmission.study_id == study_id)
    ).scalar_one()

    submitted_count = 0
    validated_count = 0
    rejected_count = 0
    partial_count = 0

    for session in sessions:
        status_summary = _get_session_status_summary(session)

        if status_summary == ParticipantHistoryStatus.SUBMITTED:
            submitted_count += 1
        elif status_summary == ParticipantHistoryStatus.VALIDATED:
            validated_count += 1
        elif status_summary == ParticipantHistoryStatus.REJECTED:
            rejected_count += 1
        elif status_summary == ParticipantHistoryStatus.PARTIAL:
            partial_count += 1

    participants_with_submissions = db.execute(
        select(func.count(func.distinct(ParticipantSubmissionSession.participant_id)))
        .where(ParticipantSubmissionSession.study_id == study_id)
    ).scalar_one()

    last_submission_at = db.execute(
        select(func.max(ParticipantSubmissionSession.created_at))
        .where(ParticipantSubmissionSession.study_id == study_id)
    ).scalar_one()

    return {
        "total_submissions": total_sessions,
        "total_sessions": total_sessions,
        "total_records": total_records,
        "total_values": total_values,
        "submitted_count": submitted_count,
        "validated_count": validated_count,
        "rejected_count": rejected_count,
        "partial_count": partial_count,
        "participants_with_submissions": participants_with_submissions,
        "last_submission_at": last_submission_at,
    }


def _timeline_label(measured_at: datetime, group_by: str) -> str:
    measured_at = measured_at.astimezone(timezone.utc)
    current_date = measured_at.date()

    if group_by == "day":
        return current_date.isoformat()

    if group_by == "week":
        week_start = current_date - timedelta(days=current_date.weekday())
        week_end = week_start + timedelta(days=6)

        return f"{week_start.isoformat()}|{week_end.isoformat()}"

    if group_by == "five_days":
        bucket_start_day = ((current_date.day - 1) // 5) * 5 + 1
        bucket_start = current_date.replace(day=bucket_start_day)
        bucket_end = bucket_start + timedelta(days=4)

        if bucket_end.month != bucket_start.month:
            next_month = (
                bucket_start.replace(day=28) + timedelta(days=4)
            ).replace(day=1)
            bucket_end = next_month - timedelta(days=1)

        return f"{bucket_start.isoformat()}|{bucket_end.isoformat()}"

    if group_by == "month":
        return current_date.strftime("%Y-%m")

    raise ValueError("group_by trebuie să fie day, week, five_days sau month.")


def _get_session_status_summary(session: ParticipantSubmissionSession) -> ParticipantHistoryStatus:
    statuses = {submission.status for submission in session.submissions}

    if statuses == {ParticipantSubmissionStatus.VALIDATED}:
        return ParticipantHistoryStatus.VALIDATED

    if statuses == {ParticipantSubmissionStatus.REJECTED}:
        return ParticipantHistoryStatus.REJECTED

    if statuses == {ParticipantSubmissionStatus.SUBMITTED}:
        return ParticipantHistoryStatus.SUBMITTED

    return ParticipantHistoryStatus.PARTIAL


def _get_session_status_counts(session: ParticipantSubmissionSession) -> dict[str, int]:
    validated_count = sum(1 for item in session.submissions if item.status == ParticipantSubmissionStatus.VALIDATED)
    pending_count = sum(1 for item in session.submissions if item.status == ParticipantSubmissionStatus.SUBMITTED)
    rejected_count = sum(1 for item in session.submissions if item.status == ParticipantSubmissionStatus.REJECTED)

    return {
        "validated_count": validated_count,
        "pending_count": pending_count,
        "rejected_count": rejected_count,
    }


def _get_common_participant_notes(session: ParticipantSubmissionSession) -> str | None:
    notes = {item.participant_notes for item in session.submissions if item.participant_notes}
    return next(iter(notes)) if len(notes) == 1 else None


def _get_common_review_notes(session: ParticipantSubmissionSession) -> str | None:
    notes = {item.review_notes for item in session.submissions if item.review_notes}
    return next(iter(notes)) if len(notes) == 1 else None


def _get_latest_reviewed_at(session: ParticipantSubmissionSession) -> datetime | None:
    reviewed_values = [item.reviewed_at for item in session.submissions if item.reviewed_at is not None]
    return max(reviewed_values) if reviewed_values else None


def get_participant_history_summary(
    db: Session,
    participant: StudyParticipant,
) -> dict:
    stmt = (
        select(ParticipantSubmissionSession)
        .options(selectinload(ParticipantSubmissionSession.submissions))
        .where(ParticipantSubmissionSession.participant_id == participant.id)
        .order_by(ParticipantSubmissionSession.created_at.desc())
    )

    sessions = list(db.execute(stmt).scalars().all())

    validated_sessions = 0
    pending_sessions = 0
    rejected_sessions = 0
    partial_sessions = 0

    for session in sessions:
        status_summary = _get_session_status_summary(session)

        if status_summary == ParticipantHistoryStatus.VALIDATED:
            validated_sessions += 1
        elif status_summary == ParticipantHistoryStatus.SUBMITTED:
            pending_sessions += 1
        elif status_summary == ParticipantHistoryStatus.REJECTED:
            rejected_sessions += 1
        elif status_summary == ParticipantHistoryStatus.PARTIAL:
            partial_sessions += 1

    last_submission_at = sessions[0].created_at if sessions else None

    return {
        "total_sessions": len(sessions),
        "validated_sessions": validated_sessions,
        "pending_sessions": pending_sessions,
        "rejected_sessions": rejected_sessions,
        "partial_sessions": partial_sessions,
        "last_submission_at": last_submission_at,
    }


def list_participant_submission_sessions(
    db: Session,
    participant: StudyParticipant,
    page: int,
    page_size: int,
    entry_method: ParticipantDataEntryMethod | None = None,
    status_summary: ParticipantHistoryStatus | None = None,
    search: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> tuple[list[dict], int, int]:
    stmt = (
        select(ParticipantSubmissionSession)
        .options(
            selectinload(ParticipantSubmissionSession.submissions)
            .selectinload(ParticipantSubmission.values)
        )
        .where(ParticipantSubmissionSession.participant_id == participant.id)
        .order_by(ParticipantSubmissionSession.created_at.desc())
    )

    sessions = list(db.execute(stmt).scalars().all())

    filtered: list[ParticipantSubmissionSession] = []

    for session in sessions:
        session_status = _get_session_status_summary(session)

        if entry_method is not None and session.entry_method != entry_method:
            continue

        if status_summary is not None and session_status != status_summary:
            continue

        if start_date is not None and session.created_at < start_date:
            continue

        if end_date is not None and session.created_at > end_date:
            continue

        if search:
            term = search.strip().lower()
            filename = (session.source_file_name or "").lower()

            if term not in filename and term not in str(session.id):
                continue

        filtered.append(session)

    total = len(filtered)
    total_pages = ceil(total / page_size) if total > 0 else 1

    page_items = filtered[(page - 1) * page_size : page * page_size]

    items: list[dict] = []

    for session in page_items:
        counts = _get_session_status_counts(session)

        items.append(
            {
                "id": session.id,
                "entry_method": session.entry_method,
                "status_summary": _get_session_status_summary(session),
                "submitted_at": session.created_at,
                "interval_start": session.interval_start,
                "interval_end": session.interval_end,
                "records_count": session.records_count,
                "validated_count": counts["validated_count"],
                "pending_count": counts["pending_count"],
                "rejected_count": counts["rejected_count"],
                "source_file_name": session.source_file_name,
                "measurement_context": session.measurement_context,
            }
        )

    return items, total, total_pages


def get_participant_submission_session_detail(
    db: Session,
    session_id: int,
    participant: StudyParticipant,
) -> dict | None:
    session = get_participant_submission_session_for_current_participant(
        db=db,
        session_id=session_id,
        participant=participant,
    )

    if session is None:
        return None

    counts = _get_session_status_counts(session)

    records = [
        {
            "submission_id": submission.id,
            "status": submission.status,
            "submitted_at": submission.submitted_at,
            "reviewed_at": submission.reviewed_at,
            "review_notes": submission.review_notes,
            "values": [
                {
                    "id": value.id,
                    "parameter_key": value.parameter_key,
                    "value": value.value,
                    "measured_at": value.measured_at,
                }
                for value in submission.values
            ],
        }
        for submission in sorted(session.submissions, key=lambda item: item.submitted_at, reverse=True)
    ]

    return {
        "id": session.id,
        "entry_method": session.entry_method,
        "status_summary": _get_session_status_summary(session),
        "submitted_at": session.created_at,
        "interval_start": session.interval_start,
        "interval_end": session.interval_end,
        "records_count": session.records_count,
        "validated_count": counts["validated_count"],
        "pending_count": counts["pending_count"],
        "rejected_count": counts["rejected_count"],
        "source_file_name": session.source_file_name,
        "participant_notes": _get_common_participant_notes(session),
        "review_notes": _get_common_review_notes(session),
        "reviewed_at": _get_latest_reviewed_at(session),
        "records": records,
        "measurement_context": session.measurement_context,
    }


def update_study_submission_session_status_for_current_user(
    db: Session,
    study_id: int,
    session_id: int,
    current_user: User,
    payload: ParticipantSubmissionUpdate,
) -> dict | None:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    stmt = (
        select(ParticipantSubmissionSession)
        .options(
            selectinload(ParticipantSubmissionSession.participant),
            selectinload(ParticipantSubmissionSession.submissions)
            .selectinload(ParticipantSubmission.values),
        )
        .where(
            ParticipantSubmissionSession.id == session_id,
            ParticipantSubmissionSession.study_id == study_id,
        )
    )

    session = db.execute(stmt).scalar_one_or_none()

    if session is None:
        return None

    now = datetime.now(timezone.utc)

    for submission in session.submissions:
        submission.status = payload.status
        submission.review_notes = payload.review_notes

        if payload.status in {
            ParticipantSubmissionStatus.VALIDATED,
            ParticipantSubmissionStatus.REJECTED,
        }:
            submission.reviewed_at = now
        else:
            submission.reviewed_at = None

        db.add(submission)

    db.commit()

    return get_study_submission_session_for_current_user(
        db=db,
        study_id=study_id,
        session_id=session_id,
        current_user=current_user,
    )


def get_study_data_timeline(
    db: Session,
    study_id: int,
    current_user: User,
    group_by: str = "day",
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> list[dict]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    if group_by not in {"day", "week", "five_days", "month"}:
        raise ValueError("group_by trebuie să fie day, week, five_days sau month.")

        filters = [ParticipantSubmission.study_id == study_id]

    if start_date is not None:
        filters.append(ParticipantSubmissionValue.measured_at >= start_date)

    if end_date is not None:
        filters.append(ParticipantSubmissionValue.measured_at <= end_date)

    rows = list(
        db.execute(
            select(
                ParticipantSubmissionValue.measured_at,
                ParticipantSubmission.id.label("submission_id"),
                ParticipantSubmission.session_id,
            )
            .join(
                ParticipantSubmission,
                ParticipantSubmission.id == ParticipantSubmissionValue.submission_id,
            )
            .where(*filters)
            .order_by(ParticipantSubmissionValue.measured_at.asc())
        ).all()
    )

    timeline: dict[str, dict[str, object]] = {}

    for measured_at, submission_id, session_id in rows:
        label = _timeline_label(measured_at, group_by)

        if label not in timeline:
            timeline[label] = {
                "session_ids": set(),
                "submission_ids": set(),
                "values_count": 0,
            }

        timeline[label]["session_ids"].add(session_id)
        timeline[label]["submission_ids"].add(submission_id)
        timeline[label]["values_count"] += 1

    return [
        {
            "label": label,
            "submissions_count": len(values["submission_ids"]),
            "sessions_count": len(values["session_ids"]),
            "records_count": len(values["submission_ids"]),
            "values_count": values["values_count"],
        }
        for label, values in sorted(timeline.items(), key=lambda item: item[0])
    ]

def _get_session_values_count(session: ParticipantSubmissionSession) -> int:
    return sum(len(submission.values) for submission in session.submissions)


def list_study_submission_sessions(
    db: Session,
    study_id: int,
    current_user: User,
    page: int,
    page_size: int,
    search: str | None = None,
    entry_method: ParticipantDataEntryMethod | None = None,
    status_summary: ParticipantHistoryStatus | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    sort_by: str = "submitted_at",
    sort_order: str = "desc",
) -> tuple[list[dict], int, int]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    filters = [ParticipantSubmissionSession.study_id == study_id]

    if entry_method is not None:
        filters.append(ParticipantSubmissionSession.entry_method == entry_method)

    if start_date is not None:
        filters.append(ParticipantSubmissionSession.created_at >= start_date)

    if end_date is not None:
        filters.append(ParticipantSubmissionSession.created_at <= end_date)

    if search:
        search_term = f"%{search.strip()}%"
        filters.append(
            or_(
                StudyParticipant.full_name.ilike(search_term),
                StudyParticipant.participant_code.ilike(search_term),
                StudyParticipant.participant_identifier.ilike(search_term),
                ParticipantSubmissionSession.source_file_name.ilike(search_term),
            )
        )

    stmt = (
        select(ParticipantSubmissionSession)
        .join(StudyParticipant, StudyParticipant.id == ParticipantSubmissionSession.participant_id)
        .options(
            selectinload(ParticipantSubmissionSession.participant),
            selectinload(ParticipantSubmissionSession.submissions)
            .selectinload(ParticipantSubmission.values),
        )
        .where(*filters)
    )

    sessions = list(db.execute(stmt).scalars().unique().all())

    filtered_sessions: list[ParticipantSubmissionSession] = []

    for session in sessions:
        session_status = _get_session_status_summary(session)

        if status_summary is not None and session_status != status_summary:
            continue

        filtered_sessions.append(session)

    reverse = sort_order != "asc"

    def sort_key(session: ParticipantSubmissionSession):
        if sort_by == "participant":
            return session.participant.full_name.lower()

        if sort_by == "records_count":
            return session.records_count or 0

        if sort_by == "values_count":
            return _get_session_values_count(session)

        if sort_by == "status":
            return _get_session_status_summary(session).value

        return session.created_at

    filtered_sessions.sort(key=sort_key, reverse=reverse)

    total = len(filtered_sessions)
    total_pages = ceil(total / page_size) if total > 0 else 1

    page_items = filtered_sessions[(page - 1) * page_size : page * page_size]

    items: list[dict] = []

    for session in page_items:
        participant = session.participant
        counts = _get_session_status_counts(session)

        items.append(
            {
                "id": session.id,
                "participant_id": participant.id,
                "participant_code": participant.participant_code,
                "participant_full_name": participant.full_name,
                "entry_method": session.entry_method,
                "status_summary": _get_session_status_summary(session),
                "submitted_at": session.created_at,
                "interval_start": session.interval_start,
                "interval_end": session.interval_end,
                "records_count": session.records_count,
                "values_count": _get_session_values_count(session),
                "validated_count": counts["validated_count"],
                "pending_count": counts["pending_count"],
                "rejected_count": counts["rejected_count"],
                "source_file_name": session.source_file_name,
                "participant_notes": _get_common_participant_notes(session),
                "review_notes": _get_common_review_notes(session),
                "reviewed_at": _get_latest_reviewed_at(session),
                "measurement_context": session.measurement_context,
            }
        )

    return items, total, total_pages


def get_study_submission_session_for_current_user(
    db: Session,
    study_id: int,
    session_id: int,
    current_user: User,
) -> dict | None:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )
    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    stmt = (
        select(ParticipantSubmissionSession)
        .options(
            selectinload(ParticipantSubmissionSession.participant),
            selectinload(ParticipantSubmissionSession.submissions)
            .selectinload(ParticipantSubmission.values),
        )
        .where(
            ParticipantSubmissionSession.id == session_id,
            ParticipantSubmissionSession.study_id == study_id,
        )
    )

    session = db.execute(stmt).scalar_one_or_none()

    if session is None:
        return None

    participant = session.participant
    counts = _get_session_status_counts(session)

    records = [
        {
            "submission_id": submission.id,
            "status": submission.status,
            "submitted_at": submission.submitted_at,
            "reviewed_at": submission.reviewed_at,
            "review_notes": submission.review_notes,
            "values": [
                {
                    "id": value.id,
                    "parameter_key": value.parameter_key,
                    "value": value.value,
                    "measured_at": value.measured_at,
                }
                for value in submission.values
            ],
        }
        for submission in sorted(
            session.submissions,
            key=lambda item: item.submitted_at,
            reverse=True,
        )
    ]

    return {
        "id": session.id,
        "participant_id": participant.id,
        "participant_code": participant.participant_code,
        "participant_full_name": participant.full_name,
        "entry_method": session.entry_method,
        "status_summary": _get_session_status_summary(session),
        "submitted_at": session.created_at,
        "interval_start": session.interval_start,
        "interval_end": session.interval_end,
        "records_count": session.records_count,
        "values_count": _get_session_values_count(session),
        "validated_count": counts["validated_count"],
        "pending_count": counts["pending_count"],
        "rejected_count": counts["rejected_count"],
        "source_file_name": session.source_file_name,
        "participant_notes": _get_common_participant_notes(session),
        "review_notes": _get_common_review_notes(session),
        "reviewed_at": _get_latest_reviewed_at(session),
        "measurement_context": session.measurement_context,
        "records": records,
    }