from datetime import datetime, timezone
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
    ParticipantSubmission,
    ParticipantSubmissionStatus,
    ParticipantSubmissionValue,
    ParticipantStatus,
    StudyParticipant,
)
from app.models.study import Study, StudyStatus
from app.models.user import User, UserRole
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantSubmissionCreate,
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

    return db.execute(stmt).scalar_one_or_none()


def get_participant_by_id(db: Session, participant_id: int) -> StudyParticipant | None:
    stmt = (
        select(StudyParticipant)
        .options(
            selectinload(StudyParticipant.study).selectinload(Study.parameters),
        )
        .where(StudyParticipant.id == participant_id)
    )
    return db.execute(stmt).scalar_one_or_none()


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

    existing_identifier = db.execute(
        select(StudyParticipant.id).where(
            StudyParticipant.study_id == study_id,
            StudyParticipant.participant_identifier == payload.participant_identifier,
        )
    ).scalar_one_or_none()

    if existing_identifier is not None:
        raise ValueError("Există deja un participant cu acest identificator în cadrul studiului.")

    temporary_pin = payload.pin or generate_numeric_pin(6)

    participant = StudyParticipant(
        study_id=study_id,
        participant_code=generate_next_participant_code_for_study(db, study_id),
        full_name=payload.full_name,
        participant_identifier=payload.participant_identifier,
        status=ParticipantStatus.INVITED,
        pin_hash=get_password_hash(temporary_pin),
        access_version=1,
        submissions_count=0,
        notes=payload.notes,
    )

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


def list_study_participants(
    db: Session,
    study_id: int,
    current_user: User,
    page: int,
    page_size: int,
    search: str | None = None,
    status: ParticipantStatus | None = None,
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

    total = db.execute(
        select(func.count()).select_from(StudyParticipant).where(*filters)
    ).scalar_one()

    stmt = (
        select(StudyParticipant)
        .where(*filters)
        .order_by(StudyParticipant.created_at.desc())
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

    if "status" in data and data["status"] is not None:
        participant.status = data["status"]

    if "notes" in data:
        participant.notes = data["notes"]

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


def get_participant_submission_by_id(
    db: Session,
    submission_id: int,
) -> ParticipantSubmission | None:
    stmt = (
        select(ParticipantSubmission)
        .options(selectinload(ParticipantSubmission.values))
        .where(ParticipantSubmission.id == submission_id)
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

    allowed_parameters = {parameter.parameter_key for parameter in participant.study.parameters}
    submitted_parameters = {item.parameter_key for item in payload.values}

    invalid_parameters = submitted_parameters - allowed_parameters
    if invalid_parameters:
        raise ValueError("Ai trimis parametri care nu fac parte din configurația studiului.")

    submission = ParticipantSubmission(
        study_id=participant.study_id,
        participant_id=participant.id,
        status=ParticipantSubmissionStatus.SUBMITTED,
        notes=payload.notes,
    )

    for item in payload.values:
        submission.values.append(
            ParticipantSubmissionValue(
                parameter_key=item.parameter_key,
                value=item.value,
                measured_at=item.measured_at or datetime.now(timezone.utc),
            )
        )

    participant.submissions_count = (participant.submissions_count or 0) + 1
    participant.last_submission_at = datetime.now(timezone.utc)

    db.add(submission)
    db.add(participant)
    db.commit()

    created_submission = get_participant_submission_by_id(db, submission.id)
    if created_submission is None:
        raise LookupError("Înregistrarea creată nu a mai putut fi încărcată.")

    return created_submission


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
            "status": submission.status,
            "submitted_at": submission.submitted_at,
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
        .options(selectinload(ParticipantSubmission.values))
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