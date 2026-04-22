from datetime import datetime, timedelta, timezone
from typing import Any
import hashlib
import secrets
import re

from jose import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()

def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Parola trebuie să aibă cel puțin 8 caractere.")

    if not re.search(r"[A-Z]", password):
        raise ValueError("Parola trebuie să conțină cel puțin o literă mare.")

    if not re.search(r"[a-z]", password):
        raise ValueError("Parola trebuie să conțină cel puțin o literă mică.")

    if not re.search(r"\d", password):
        raise ValueError("Parola trebuie să conțină cel puțin o cifră.")

    if not re.search(r"[^\w\s]", password):
        raise ValueError("Parola trebuie să conțină cel puțin un caracter special.")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.access_token_expire_minutes)

    expire = datetime.now(timezone.utc) + expires_delta

    to_encode: dict[str, Any] = {
        "sub": subject,
        "exp": expire,
    }

    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.algorithm],
    )


def generate_password_reset_token() -> str:
    return secrets.token_urlsafe(32)


def hash_password_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_numeric_pin(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))