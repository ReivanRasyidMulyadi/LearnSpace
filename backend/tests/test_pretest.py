"""Pre-Test engine backend tests.

Covers:
- GET /api/tests/{course_id}/pre-test  (auth, 404, question hygiene, attempt=null)
- POST /api/tests/{course_id}/pre-test/submit (score, review, 409, 403, 422)
- GET /api/tests/{course_id}/pre-test/result (404 before, attempt after)
- GET /api/courses/{course_id}/progress (locks before, unlocks after)
- GET /api/courses (lists 4 courses)
- GET /api/dashboard/student (continue_learning + subjects reflect state)
"""
import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://learnspace-app.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@learnspace.app", "password": "Admin@123"}
COURSES = ["math", "science", "english", "history"]
# Avoid "math" per request: prefer english for full submit flow.
SUBMIT_COURSE = "english"


def _no_mongo_id(obj):
    if isinstance(obj, dict):
        assert "_id" not in obj, f"_id leaked: {obj}"
        for v in obj.values():
            _no_mongo_id(v)
    elif isinstance(obj, list):
        for item in obj:
            _no_mongo_id(item)


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def fresh_student(session):
    """Register a fresh student per test module."""
    email = f"test_pretest_{uuid.uuid4().hex[:10]}@example.com"
    r = session.post(
        f"{API}/auth/register",
        json={"email": email, "password": "Passw0rd!", "name": "TEST PreTest"},
    )
    assert r.status_code == 201, r.text
    data = r.json()
    return {
        "email": email,
        "token": data["session_token"],
        "user_id": data["user"]["user_id"],
        "headers": {"Authorization": f"Bearer {data['session_token']}"},
    }


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json=ADMIN)
    assert r.status_code == 200
    return r.json()["session_token"]


# -------- GET pre-test ----------------------------------------------------
def test_pretest_requires_auth(session):
    r = session.get(f"{API}/tests/{SUBMIT_COURSE}/pre-test")
    assert r.status_code == 401


def test_pretest_unknown_course_404(session, fresh_student):
    r = session.get(f"{API}/tests/unknown/pre-test", headers=fresh_student["headers"])
    assert r.status_code == 404
    assert r.json()["detail"] == "course_not_found"


def test_pretest_returns_5_questions_without_correct_index(session, fresh_student):
    r = session.get(f"{API}/tests/{SUBMIT_COURSE}/pre-test", headers=fresh_student["headers"])
    assert r.status_code == 200, r.text
    data = r.json()
    _no_mongo_id(data)
    assert data["course_id"] == SUBMIT_COURSE
    assert data["course_title"] == "Bahasa Inggris"
    assert data["test_type"] == "pre_test"
    assert data["total_questions"] == 5
    assert len(data["questions"]) == 5
    assert data["attempt"] is None
    for q in data["questions"]:
        assert "correct_index" not in q, "correct_index must not leak"
        assert "question_id" in q
        assert "options" in q and len(q["options"]) == 4
        assert "order" in q and "text" in q


# -------- POST submit -----------------------------------------------------
def test_pretest_submit_admin_forbidden(session, admin_token):
    r = session.post(
        f"{API}/tests/{SUBMIT_COURSE}/pre-test/submit",
        json={"answers": {}},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "forbidden_role"


def test_pretest_submit_invalid_option_index_422(session, fresh_student):
    # Use a known question_id for english pre-test.
    r = session.post(
        f"{API}/tests/{SUBMIT_COURSE}/pre-test/submit",
        json={"answers": {"english_pre_1": 9}},
        headers=fresh_student["headers"],
    )
    assert r.status_code == 422
    assert "invalid_option" in r.json()["detail"]


def test_pretest_submit_scores_and_returns_review(session, fresh_student):
    # Submit answers: get Q1 right, Q2 wrong, Q3 unanswered, Q4 right, Q5 right.
    # English correct indexes: 1,0,2,1,2
    answers = {
        "english_pre_1": 1,  # correct
        "english_pre_2": 2,  # wrong
        # english_pre_3 omitted (unanswered -> wrong)
        "english_pre_4": 1,  # correct
        "english_pre_5": 2,  # correct
    }
    r = session.post(
        f"{API}/tests/{SUBMIT_COURSE}/pre-test/submit",
        json={"answers": answers},
        headers=fresh_student["headers"],
    )
    assert r.status_code == 200, r.text
    data = r.json()
    _no_mongo_id(data)
    assert data["total"] == 5
    assert data["score"] == 3
    assert data["percentage"] == 60
    assert len(data["review"]) == 5
    by_id = {item["question_id"]: item for item in data["review"]}
    assert by_id["english_pre_1"]["selected_index"] == 1
    assert by_id["english_pre_1"]["correct_index"] == 1
    assert by_id["english_pre_1"]["is_correct"] is True
    assert by_id["english_pre_2"]["is_correct"] is False
    assert by_id["english_pre_3"]["selected_index"] is None
    assert by_id["english_pre_3"]["is_correct"] is False
    for item in data["review"]:
        assert "correct_index" in item  # review DOES include correct_index
        assert "options" in item and len(item["options"]) == 4


def test_pretest_submit_second_time_409(session, fresh_student):
    r = session.post(
        f"{API}/tests/{SUBMIT_COURSE}/pre-test/submit",
        json={"answers": {}},
        headers=fresh_student["headers"],
    )
    assert r.status_code == 409
    assert r.json()["detail"] == "already_attempted"


# -------- GET result ------------------------------------------------------
def test_pretest_result_after_submit(session, fresh_student):
    r = session.get(
        f"{API}/tests/{SUBMIT_COURSE}/pre-test/result",
        headers=fresh_student["headers"],
    )
    assert r.status_code == 200, r.text
    data = r.json()
    _no_mongo_id(data)
    assert data["course_id"] == SUBMIT_COURSE
    assert data["score"] == 3
    assert data["total"] == 5
    assert data["percentage"] == 60
    assert len(data["review"]) == 5


def test_pretest_result_no_attempt_404(session, fresh_student):
    # history course was never submitted by this fresh student.
    r = session.get(
        f"{API}/tests/history/pre-test/result",
        headers=fresh_student["headers"],
    )
    assert r.status_code == 404
    assert r.json()["detail"] == "no_attempt"


# -------- Course progress -------------------------------------------------
def test_course_progress_before_submit_all_locked(session, fresh_student):
    # history was never submitted.
    r = session.get(
        f"{API}/courses/history/progress",
        headers=fresh_student["headers"],
    )
    assert r.status_code == 200, r.text
    data = r.json()
    _no_mongo_id(data)
    assert data["pre_test_completed"] is False
    assert data["progress_percent"] == 0
    assert data["next_module"] == "pre_test"
    mods = {m["key"]: m for m in data["modules"]}
    assert mods["pre_test"]["locked"] is False
    for key in ("materials", "videos", "manual_book", "discussion", "post_test", "results"):
        assert mods[key]["locked"] is True, f"{key} should be locked before pre-test"


def test_course_progress_after_submit_unlocks_all(session, fresh_student):
    r = session.get(
        f"{API}/courses/{SUBMIT_COURSE}/progress",
        headers=fresh_student["headers"],
    )
    assert r.status_code == 200, r.text
    data = r.json()
    _no_mongo_id(data)
    assert data["pre_test_completed"] is True
    # 1 of 7 modules completed -> 14%
    assert data["progress_percent"] == 14
    assert data["next_module"] == "materials"
    mods = {m["key"]: m for m in data["modules"]}
    assert mods["pre_test"]["completed"] is True
    for key in ("materials", "videos", "manual_book", "discussion", "post_test", "results"):
        assert mods[key]["locked"] is False, f"{key} should be unlocked after pre-test"


def test_courses_list_returns_four(session, fresh_student):
    r = session.get(f"{API}/courses", headers=fresh_student["headers"])
    assert r.status_code == 200, r.text
    data = r.json()
    _no_mongo_id(data)
    ids = [c["id"] for c in data["courses"]]
    for cid in COURSES:
        assert cid in ids
    submitted = next(c for c in data["courses"] if c["id"] == SUBMIT_COURSE)
    assert submitted["pre_test_completed"] is True
    assert submitted["progress"] == 14
    unstarted = next(c for c in data["courses"] if c["id"] == "history")
    assert unstarted["pre_test_completed"] is False
    assert unstarted["progress"] == 0


# -------- Dashboard reflects state ---------------------------------------
def test_dashboard_reflects_pretest_completion(session, fresh_student):
    r = session.get(f"{API}/dashboard/student", headers=fresh_student["headers"])
    assert r.status_code == 200, r.text
    data = r.json()
    _no_mongo_id(data)
    subjects_by_id = {s["id"]: s for s in data["subjects"]}
    assert subjects_by_id[SUBMIT_COURSE]["pre_test_completed"] is True
    assert subjects_by_id["history"]["pre_test_completed"] is False
    # continue_learning is the first course with a next_module.
    assert data["continue_learning"] is not None
    # Order matches COURSES dict iteration order: math, science, english, history.
    # math/science/history still have next_module=pre_test; math comes first.
    cl = data["continue_learning"]
    assert cl["next_module"] in {"pre_test", "materials"}
    assert "next_module_title" in cl
