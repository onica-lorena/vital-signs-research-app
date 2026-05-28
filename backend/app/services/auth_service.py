from datetime import datetime, timezone

from sqlalchemy import func, select

from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User, UserRole


def get_user_by_id(db: Session, user_id: int) -> User | None:
    stmt = select(User).where(User.id == user_id)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    return db.execute(stmt).scalar_one_or_none()


def get_user_by_reset_token_hash(db: Session, token_hash: str) -> User | None:
    stmt = select(User).where(User.reset_password_token_hash == token_hash)
    return db.execute(stmt).scalar_one_or_none()


def list_users(db: Session) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)

    if user is None:
        return None

    if not user.is_active:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user

def _add_months(year: int, month: int, offset: int) -> tuple[int, int]:
    month_index = year * 12 + (month - 1) + offset
    new_year = month_index // 12
    new_month = month_index % 12 + 1
    return new_year, new_month


def get_users_admin_summary(db: Session) -> dict:
    total_users = db.execute(
        select(func.count()).select_from(User)
    ).scalar_one()

    role_rows = db.execute(
        select(User.role, func.count())
        .group_by(User.role)
    ).all()

    role_counts = {row[0]: row[1] for row in role_rows}

    active_users = db.execute(
        select(func.count())
        .select_from(User)
        .where(User.is_active.is_(True))
    ).scalar_one()

    inactive_users = db.execute(
        select(func.count())
        .select_from(User)
        .where(User.is_active.is_(False))
    ).scalar_one()

    verified_users = db.execute(
        select(func.count())
        .select_from(User)
        .where(User.is_verified.is_(True))
    ).scalar_one()

    unverified_users = db.execute(
        select(func.count())
        .select_from(User)
        .where(User.is_verified.is_(False))
    ).scalar_one()

    now = datetime.now(timezone.utc)

    month_starts = []
    for offset in range(-5, 1):
        year, month = _add_months(now.year, now.month, offset)
        month_starts.append(datetime(year, month, 1, tzinfo=timezone.utc))

    start_date = month_starts[0]

    monthly_rows = db.execute(
        select(
            func.date_trunc("month", User.created_at).label("month"),
            func.count().label("users_count"),
        )
        .where(User.created_at >= start_date)
        .group_by("month")
        .order_by("month")
    ).all()

    monthly_map: dict[str, int] = {}

    for month_value, users_count in monthly_rows:
        if month_value.tzinfo is None:
            month_value = month_value.replace(tzinfo=timezone.utc)

        key = month_value.strftime("%Y-%m")
        monthly_map[key] = users_count

    monthly_users = [
        {
            "month": month_start.strftime("%Y-%m"),
            "users_count": monthly_map.get(month_start.strftime("%Y-%m"), 0),
        }
        for month_start in month_starts
    ]

    return {
        "total_users": total_users,
        "admin_users": role_counts.get(UserRole.ADMIN, 0),
        "researcher_users": role_counts.get(UserRole.RESEARCHER, 0),
        "active_users": active_users,
        "inactive_users": inactive_users,
        "verified_users": verified_users,
        "unverified_users": unverified_users,
        "monthly_users": monthly_users,
    }