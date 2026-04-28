from datetime import datetime, timedelta, timezone
from math import ceil
import secrets
import smtplib

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    generate_password_reset_token,
    get_password_hash,
    hash_password_reset_token,
)
from app.models.access_request import AccessRequest, AccessRequestStatus
from app.models.user import User, UserRole
from app.schemas.access_request import AccessRequestCreate
from app.services.auth_service import get_user_by_email
from app.services.email_service import (
    send_access_request_rejected_email,
    send_researcher_access_approved_email,
)


def create_access_request(
    db: Session,
    payload: AccessRequestCreate,
) -> AccessRequest:
    email = str(payload.email).strip().lower()

    existing_user = get_user_by_email(db, email)
    if existing_user is not None:
        raise ValueError("Există deja un cont asociat acestui email.")

    existing_pending_request = db.execute(
        select(AccessRequest).where(
            AccessRequest.email == email,
            AccessRequest.status == AccessRequestStatus.PENDING,
        )
    ).scalar_one_or_none()

    if existing_pending_request is not None:
        raise ValueError("Există deja o solicitare în așteptare pentru acest email.")

    access_request = AccessRequest(
        full_name=payload.full_name,
        email=email,
        institution=payload.institution,
        department=payload.department,
        specialization=payload.specialization,
        phone=payload.phone,
        request_reason=payload.request_reason,
        status=AccessRequestStatus.PENDING,
    )

    try:
        db.add(access_request)
        db.commit()
        db.refresh(access_request)
    except IntegrityError:
        db.rollback()
        raise ValueError("Solicitarea nu a putut fi salvată. Încearcă din nou.")

    return access_request


def list_access_requests(
    db: Session,
    page: int,
    page_size: int,
    status: AccessRequestStatus | None = None,
    search: str | None = None,
) -> tuple[list[AccessRequest], int, int]:
    filters = []

    if status is not None:
        filters.append(AccessRequest.status == status)

    if search:
        search_term = f"%{search.strip()}%"
        filters.append(
            or_(
                AccessRequest.full_name.ilike(search_term),
                AccessRequest.email.ilike(search_term),
                AccessRequest.institution.ilike(search_term),
            )
        )

    total = db.execute(
        select(func.count()).select_from(AccessRequest).where(*filters)
    ).scalar_one()

    stmt = (
        select(AccessRequest)
        .where(*filters)
        .order_by(AccessRequest.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(db.execute(stmt).scalars().all())
    total_pages = ceil(total / page_size) if total > 0 else 1

    return items, total, total_pages


def get_access_request_by_id(
    db: Session,
    access_request_id: int,
) -> AccessRequest | None:
    stmt = select(AccessRequest).where(AccessRequest.id == access_request_id)
    return db.execute(stmt).scalar_one_or_none()


def approve_access_request(
    db: Session,
    access_request_id: int,
    current_admin: User,
    review_notes: str | None = None,
) -> AccessRequest:
    access_request = get_access_request_by_id(db, access_request_id)
    if access_request is None:
        raise LookupError("Solicitarea de acces nu a fost găsită.")

    if access_request.status != AccessRequestStatus.PENDING:
        raise ValueError("Doar solicitările aflate în așteptare pot fi aprobate.")

    existing_user = get_user_by_email(db, access_request.email)
    if existing_user is not None:
        raise ValueError("Există deja un utilizator creat cu acest email.")

    temporary_password = secrets.token_urlsafe(16)

    user = User(
        email=access_request.email,
        full_name=access_request.full_name,
        hashed_password=get_password_hash(temporary_password),
        role=UserRole.RESEARCHER,
        is_active=True,
        is_verified=True,
        institution=access_request.institution,
        department=access_request.department,
        specialization=access_request.specialization,
        phone=access_request.phone,
        bio=None,
    )

    raw_token = generate_password_reset_token()
    user.reset_password_token_hash = hash_password_reset_token(raw_token)
    user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.reset_password_token_expire_minutes
    )

    access_request.status = AccessRequestStatus.APPROVED
    access_request.reviewed_at = datetime.now(timezone.utc)
    access_request.review_notes = review_notes
    access_request.reviewed_by_user_id = current_admin.id

    setup_link = f"{settings.frontend_base_url}/resetare-parola?token={raw_token}"

    try:
        db.add(user)
        db.flush()

        access_request.created_user_id = user.id
        db.add(access_request)

        send_researcher_access_approved_email(
            to_email=user.email,
            reset_link=setup_link,
        )

        db.commit()
        db.refresh(access_request)

    except smtplib.SMTPException as exc:
        db.rollback()
        raise ValueError(
            "Emailul de activare nu a putut fi trimis. Cererea nu a fost aprobată."
        ) from exc

    except IntegrityError:
        db.rollback()
        raise ValueError("Solicitarea nu a putut fi aprobată.")

    except Exception:
        db.rollback()
        raise

    return access_request


def reject_access_request(
    db: Session,
    access_request_id: int,
    current_admin: User,
    review_notes: str | None = None,
) -> AccessRequest:
    access_request = get_access_request_by_id(db, access_request_id)
    if access_request is None:
        raise LookupError("Solicitarea de acces nu a fost găsită.")

    if access_request.status != AccessRequestStatus.PENDING:
        raise ValueError("Doar solicitările aflate în așteptare pot fi respinse.")

    access_request.status = AccessRequestStatus.REJECTED
    access_request.reviewed_at = datetime.now(timezone.utc)
    access_request.review_notes = review_notes
    access_request.reviewed_by_user_id = current_admin.id

    try:
        db.add(access_request)

        send_access_request_rejected_email(
            to_email=access_request.email,
            reason=review_notes,
        )

        db.commit()
        db.refresh(access_request)

    except smtplib.SMTPException as exc:
        db.rollback()
        raise ValueError(
            "Emailul de respingere nu a putut fi trimis. Cererea nu a fost respinsă."
        ) from exc

    except IntegrityError:
        db.rollback()
        raise ValueError("Solicitarea nu a putut fi respinsă.")

    except Exception:
        db.rollback()
        raise

    return access_request