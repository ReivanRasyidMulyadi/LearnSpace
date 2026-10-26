"""Authentication and role-authorization regression tests.

Covers register/login/me/logout and cross-role protected-route checks.
"""

import os
import uuid
from pathlib import Path

import pytest
import requests


def _load_backend_url() -> str:
    url = os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    if url:
        return url.rstrip("/")

    env_file = Path("/app/frontend/.env")
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith("EXPO_BACKEND_URL="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
                if value:
                    return value.rstrip("/")
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                value = line.split("=", 1)[1].strip().strip('"').strip("'")
                if value:
                    return value.rstrip("/")

    raise RuntimeError("Missing EXPO_BACKEND_URL/EXPO_PUBLIC_BACKEND_URL")


BASE_URL = _load_backend_url()
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@learnspace.app", "password": "Admin@123"}
STUDENT = {"email": "student@learnspace.app", "password": "Student@123"}


@pytest.fixture(scope="module")
def api_client():
    """Shared HTTP session for auth API coverage."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def fresh_student(api_client):
    """Create a new student via public registration endpoint."""
    email = f"test_auth_{uuid.uuid4().hex[:10]}@example.com"
    payload = {
        "email": email,
        "password": "Passw0rd123",
        "name": "TEST Auth Student",
    }
    response = api_client.post(f"{API}/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["user"]["email"] == email
    assert data["user"]["role"] == "STUDENT"
    return data


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Login using provisioned ADMIN test account."""
    response = api_client.post(f"{API}/auth/login", json=ADMIN)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["user"]["role"] == "ADMIN"
    return data["session_token"]


@pytest.fixture(scope="module")
def student_token(api_client):
    """Login using provisioned STUDENT test account."""
    response = api_client.post(f"{API}/auth/login", json=STUDENT)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["user"]["role"] == "STUDENT"
    return data["session_token"]


# auth/register
def test_register_rejects_client_role_injection(api_client):
    payload = {
        "email": f"test_auth_inject_{uuid.uuid4().hex[:8]}@example.com",
        "password": "Passw0rd123",
        "name": "TEST Inject",
        "role": "ADMIN",
    }
    response = api_client.post(f"{API}/auth/register", json=payload)
    assert response.status_code == 422


def test_register_creates_student_only(fresh_student):
    assert fresh_student["user"]["role"] == "STUDENT"


# auth/login
def test_login_student_success(api_client):
    response = api_client.post(f"{API}/auth/login", json=STUDENT)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "STUDENT"
    assert isinstance(data["session_token"], str) and len(data["session_token"]) > 16


def test_login_admin_success(api_client):
    response = api_client.post(f"{API}/auth/login", json=ADMIN)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "ADMIN"
    assert isinstance(data["session_token"], str) and len(data["session_token"]) > 16


def test_login_invalid_credentials_rejected(api_client):
    response = api_client.post(
        f"{API}/auth/login",
        json={"email": STUDENT["email"], "password": "WrongPassword123"},
    )
    assert response.status_code == 401
    assert response.json().get("detail") == "invalid_credentials"


# auth/me and auth/logout
def test_me_restores_valid_session(fresh_student, api_client):
    token = fresh_student["session_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = api_client.get(f"{API}/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["user_id"] == fresh_student["user"]["user_id"]


def test_logout_revokes_server_session(api_client):
    login_response = api_client.post(f"{API}/auth/login", json=STUDENT)
    assert login_response.status_code == 200
    token = login_response.json()["session_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_before = api_client.get(f"{API}/auth/me", headers=headers)
    assert me_before.status_code == 200

    logout_response = api_client.post(f"{API}/auth/logout", headers=headers)
    assert logout_response.status_code == 200
    assert logout_response.json().get("ok") is True

    me_after = api_client.get(f"{API}/auth/me", headers=headers)
    assert me_after.status_code == 401


# role authorization
def test_student_forbidden_on_admin_overview(api_client, student_token):
    response = api_client.get(
        f"{API}/dashboard/admin/overview",
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert response.status_code == 403


def test_admin_forbidden_on_student_routes(api_client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}

    student_dashboard = api_client.get(f"{API}/dashboard/student", headers=headers)
    assert student_dashboard.status_code == 403

    courses = api_client.get(f"{API}/courses", headers=headers)
    assert courses.status_code == 403

    tests = api_client.get(f"{API}/tests/math/pre-test", headers=headers)
    assert tests.status_code == 403
