"""Database-backed authentication and role authorization for LearnSpace."""
from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Callable, Optional

import bcrypt
import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from pymongo.errors import DuplicateKeyError

from db import db
from db_models import gen_id, utcnow
from models import (
    AuthResponse,
    GoogleSessionRequest,
    LoginRequest,
    RegisterRequest,
    Role,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])

SESSION_TTL = timedelta(days=7)
EMERGENT_SESSION_DATA_URL = (
    "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"
)
DUMMY_PASSWORD_HASH = bcrypt.hashpw(secrets.token_bytes(32), bcrypt.gensalt())


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, UnicodeEncodeError):
        return False


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing_token")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="missing_token")
    return token


async def _create_profile(user_id: str) -> None:
    now = utcnow()
    await db.profiles.update_one(
        {"user_id": user_id},
        {
            "$setOnInsert": {
                "profile_id": gen_id("prof"),
                "user_id": user_id,
                "bio": None,
                "phone": None,
                "school": None,
                "grade": None,
                "avatar_url": None,
                "date_of_birth": None,
                "created_at": now,
                "updated_at": now,
            }
        },
        upsert=True,
    )


async def _create_session(user_id: str) -> str:
    session_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    await db.user_sessions.insert_one(
        {
            "token_hash": _token_hash(session_token),
            "user_id": user_id,
            "created_at": now,
            "expires_at": now + SESSION_TTL,
        }
    )
    return session_token


async def _find_session(token: str) -> Optional[dict]:
    digest = _token_hash(token)
    session = await db.user_sessions.find_one({"token_hash": digest}, {"_id": 0})
    if session:
        return session

    # One-time migration path for sessions created before token hashing.
    legacy = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if legacy:
        await db.user_sessions.update_one(
            {"session_token": token},
            {"$set": {"token_hash": digest}, "$unset": {"session_token": ""}},
        )
    return legacy


async def _get_user_public(user_id: str) -> UserPublic:
    doc = await db.users.find_one(
        {"user_id": user_id}, {"_id": 0, "password_hash": 0}
    )
    if not doc:
        raise HTTPException(status_code=401, detail="user_not_found")
    return UserPublic(**doc)


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> UserPublic:
    token = _bearer_token(authorization)
    session = await _find_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="invalid_token")

    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        await db.user_sessions.delete_many({"user_id": session["user_id"]})
        raise HTTPException(status_code=401, detail="expired_token")
    return await _get_user_public(session["user_id"])


def require_role(*allowed_roles: Role) -> Callable:
    async def dependency(user: UserPublic = Depends(get_current_user)) -> UserPublic:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="forbidden_role")
        return user

    return dependency


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(payload: RegisterRequest) -> AuthResponse:
    email = str(payload.email).strip().lower()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    doc = {
        "user_id": user_id,
        "email": email,
        "name": payload.name,
        "role": "STUDENT",
        "password_hash": _hash_password(payload.password),
        "picture": None,
        "auth_provider": "password",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    try:
        await db.users.insert_one(doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="email_already_registered") from exc

    await _create_profile(user_id)
    token = await _create_session(user_id)
    return AuthResponse(session_token=token, user=await _get_user_public(user_id))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> AuthResponse:
    email = str(payload.email).strip().lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    password_hash = user.get("password_hash") if user else None
    verified = (
        _verify_password(payload.password, password_hash)
        if password_hash
        else bcrypt.checkpw(payload.password.encode("utf-8"), DUMMY_PASSWORD_HASH)
    )
    if not user or not verified:
        raise HTTPException(status_code=401, detail="invalid_credentials")

    token = await _create_session(user["user_id"])
    return AuthResponse(
        session_token=token, user=await _get_user_public(user["user_id"])
    )


@router.post("/session", response_model=AuthResponse)
async def google_session(payload: GoogleSessionRequest) -> AuthResponse:
    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            response = await http.get(
                EMERGENT_SESSION_DATA_URL,
                headers={"X-Session-ID": payload.session_id},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=401, detail="emergent_unreachable") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="invalid_session_id")

    data = response.json()
    email = (data.get("email") or "").strip().lower()
    name = data.get("name") or email.split("@")[0] or "LearnSpace User"
    picture = data.get("picture")
    if not email:
        raise HTTPException(status_code=401, detail="emergent_missing_email")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one(
            {
                "user_id": user_id,
                "email": email,
                "name": name,
                "role": "STUDENT",
                "password_hash": None,
                "picture": picture,
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }
        )
        await _create_profile(user_id)

    token = await _create_session(user_id)
    return AuthResponse(session_token=token, user=await _get_user_public(user_id))


@router.get("/me", response_model=UserPublic)
async def me(user: UserPublic = Depends(get_current_user)) -> UserPublic:
    return user


@router.post("/logout")
async def logout(
    _: UserPublic = Depends(get_current_user),
    authorization: Optional[str] = Header(default=None),
) -> dict:
    token = _bearer_token(authorization)
    await db.user_sessions.delete_many(
        {"$or": [{"token_hash": _token_hash(token)}, {"session_token": token}]}
    )
    return {"ok": True}


async def migrate_auth_data() -> None:
    """Normalize legacy role values without creating demo credentials."""
    await db.users.update_many({"role": "student"}, {"$set": {"role": "STUDENT"}})
    await db.users.update_many({"role": "admin"}, {"$set": {"role": "ADMIN"}})
    async for session in db.user_sessions.find(
        {"session_token": {"$exists": True}}, {"session_token": 1}
    ):
        raw_token = session.get("session_token")
        if not raw_token:
            continue
        await db.user_sessions.update_one(
            {"_id": session["_id"]},
            {
                "$set": {"token_hash": _token_hash(raw_token)},
                "$unset": {"session_token": ""},
            },
        )

    # Backfill profiles + updated_at for users created before this schema.
    await db.users.update_many(
        {"updated_at": {"$exists": False}},
        [{"$set": {"updated_at": "$created_at"}}],
    )
    async for user in db.users.find({}, {"user_id": 1}):
        await _create_profile(user["user_id"])