from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User


ADMIN_EMAIL = "admin@vitalstudy.ro"
NEW_PASSWORD = "onicalorena"


def change_admin_password():
    db = SessionLocal()

    try:
        admin = db.execute(
            select(User).where(User.email == ADMIN_EMAIL)
        ).scalar_one_or_none()

        if admin is None:
            print("Nu există utilizatorul admin.")
            return

        admin.hashed_password = get_password_hash(NEW_PASSWORD)
        db.commit()

        print("Parola adminului a fost actualizată cu succes.")
    finally:
        db.close()


if __name__ == "__main__":
    change_admin_password()