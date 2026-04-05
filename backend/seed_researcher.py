from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole


def seed_researcher():
    db = SessionLocal()

    try:
        existing_user = db.execute(
            select(User).where(User.email == "researcher@gmail.com")
        ).scalar_one_or_none()

        if existing_user:
            print("Cercetătorul există deja.")
            return

        researcher = User(
            email="researcher@gmail.com",
            full_name="Cercetător Test",
            hashed_password=get_password_hash("researcher123"),
            role=UserRole.RESEARCHER,
            is_active=True,
            is_verified=True,
        )

        db.add(researcher)
        db.commit()
        print("Cercetător creat cu succes.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_researcher()