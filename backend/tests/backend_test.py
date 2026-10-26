"""LearnSpace backend API tests.

Covers: health, email/password auth (register/login/me/logout), role-aware
dashboards, invalid Google session, and _id leakage checks.
"""
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://learnspace-app.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@learnspace.app", "password": "Admin@123"}
STUDENT = {"email": "student@learnspace.app", "password": "Student@123"}


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _no_mongo_id(obj):
    """Recursively ensure no `_id` key exists in response payloads."""
    if isinstance(obj, dict):
        assert "_id" not in obj, f"_id leaked in payload: {obj}"
        for v in obj.values():
            _no_mongo_id(v)
    elif isinstance(obj, list):
        for item in obj:
            _no_mongo_id(item)


# --- health ---------------------------------------------------------------
def test_health_ok(session):
    r = session.get(f"{API}/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


# --- auth: login provisioned test users ----------------------------------
def test_login_admin_returns_admin_role(session):
    r = session.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "session_token" in data and isinstance(data["session_token"], str)
    assert data["user"]["email"] == ADMIN["email"]
    assert data["user"]["role"] == "ADMIN"
    _no_mongo_id(data)


def test_login_student_returns_student_role(session):
    r = session.post(f"{API}/auth/login", json=STUDENT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["email"] == STUDENT["email"]
    _no_mongo_id(data)


def test_login_wrong_password_returns_401(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong-pass"})
    assert r.status_code == 401
    assert r.json().get("detail") == "invalid_credentials"


# --- auth: register ------------------------------------------------------
@pytest.fixture(scope="module")
def new_user_tokens(session):
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = session.post(
        f"{API}/auth/register",
        json={"email": email, "password": "Passw0rd!", "name": "TEST User"},
    )
    assert r.status_code == 201, r.text
    data = r.json()
    _no_mongo_id(data)
    assert data["user"]["role"] == "STUDENT"
    assert data["user"]["auth_provider"] == "password"
    return {"email": email, "token": data["session_token"], "user": data["user"]}


def test_register_creates_user_and_token(new_user_tokens):
    assert new_user_tokens["token"]
    assert new_user_tokens["user"]["email"] == new_user_tokens["email"]


def test_register_duplicate_email_conflict(session, new_user_tokens):
    r = session.post(
        f"{API}/auth/register",
        json={"email": new_user_tokens["email"], "password": "Passw0rd!", "name": "Dup"},
    )
    assert r.status_code == 409


# --- auth: me / logout ---------------------------------------------------
def test_me_requires_token(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_valid_token(session, new_user_tokens):
    r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {new_user_tokens['token']}"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == new_user_tokens["email"]
    _no_mongo_id(data)


def test_logout_revokes_session(session):
    # login fresh so other tests aren't affected
    r = session.post(f"{API}/auth/login", json=STUDENT)
    token = r.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me1 = session.get(f"{API}/auth/me", headers=headers)
    assert me1.status_code == 200

    out = session.post(f"{API}/auth/logout", headers=headers)
    assert out.status_code == 200

    me2 = session.get(f"{API}/auth/me", headers=headers)
    assert me2.status_code == 401


# --- auth: invalid google session_id -------------------------------------
def test_invalid_session_id_returns_401(session):
    r = session.post(f"{API}/auth/session", json={"session_id": "invalid-xyz-" + uuid.uuid4().hex})
    assert r.status_code == 401


# --- dashboards: role gating --------------------------------------------
@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200
    return r.json()["session_token"]


@pytest.fixture(scope="module")
def student_token(session):
    r = session.post(f"{API}/auth/login", json=STUDENT)
    assert r.status_code == 200
    return r.json()["session_token"]


def test_student_dashboard_for_student(session, student_token):
    r = session.get(f"{API}/dashboard/student", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "greeting" in data
    assert isinstance(data["subjects"], list) and len(data["subjects"]) >= 1
    _no_mongo_id(data)


def test_student_dashboard_rejects_admin(session, admin_token):
    r = session.get(f"{API}/dashboard/student", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 403


def test_admin_overview_for_admin(session, admin_token):
    r = session.get(f"{API}/dashboard/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "metrics" in data
    for key in ("total_students", "active_courses", "completion_rate", "pending_reviews"):
        assert key in data["metrics"]
    assert isinstance(data["recent_activity"], list)
    _no_mongo_id(data)


def test_admin_overview_rejects_student(session, student_token):
    r = session.get(f"{API}/dashboard/admin/overview", headers={"Authorization": f"Bearer {student_token}"})
    assert r.status_code == 403
