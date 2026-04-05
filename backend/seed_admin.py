from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def seed_admin():
    db = SessionLocal()

    try:
        existing_admin = db.execute(
            select(User).where(User.email == "admin@vitalstudy.ro")
        ).scalar_one_or_none()

        if existing_admin:
            print("Adminul există deja.")
            return

        admin = User(
            email="admin@vitalstudy.ro",
            full_name="Administrator VitalStudy",
            hashed_password=get_password_hash("onicalorena"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )

        db.add(admin)
        db.commit()
        print("Admin creat cu succes.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()