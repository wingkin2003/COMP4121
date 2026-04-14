from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.config import settings
from app.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(username: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": username, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


async def register_user(username: str, email: str, password: str) -> dict:
    db = get_db()
    existing = await db.users.find_one({"username": username})
    if existing:
        raise ValueError("Username already exists")

    user_doc = {
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    return user_doc


async def authenticate_user(username: str, password: str) -> dict | None:
    db = get_db()
    user = await db.users.find_one({"username": username})
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


async def get_user_by_username(username: str) -> dict | None:
    db = get_db()
    return await db.users.find_one({"username": username})


async def update_user(username: str, updates: dict) -> dict | None:
    db = get_db()
    result = await db.users.find_one_and_update(
        {"username": username},
        {"$set": updates},
        return_document=True,
    )
    return result
