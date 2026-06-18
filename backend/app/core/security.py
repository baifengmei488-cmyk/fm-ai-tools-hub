from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 8


def hash_password(password: str, salt: str | None = None) -> str:
    actual_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), actual_salt.encode(), 200_000)
    return f"pbkdf2_sha256${actual_salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    algorithm, salt, expected = password_hash.split("$", 2)
    if algorithm != "pbkdf2_sha256":
        return False
    actual = hash_password(password, salt).split("$", 2)[2]
    return secrets.compare_digest(actual, expected)


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expires_at}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
    subject = payload.get("sub")
    return subject if isinstance(subject, str) else None
