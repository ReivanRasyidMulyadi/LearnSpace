"""Pre-Test engine on the normalized schema.

Reads questions + options from `questions` / `answers`, records a
`test_attempts` session and a scored `test_results` document, and unlocks the
course flow via `course_progress`. API response shapes are unchanged.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from auth import require_role
from courses import get_course
from db import db
from db_models import gen_id, utcnow
from models import SubmitTestRequest, UserPublic
from seed_data import PRE_TEST_PASSING_SCORE

router = APIRouter(prefix="/tests", tags=["tests"])

TEST_TYPE = "pre_test"


async def _require_course_title(course_id: str) -> str:
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")
    return course["title"]


async def _existing_result(user_id: str, course_id: str) -> Optional[dict]:
    return await db.test_results.find_one(
        {"user_id": user_id, "course_id": course_id, "test_type": TEST_TYPE},
        {"_id": 0},
        sort=[("completed_at", -1)],
    )


async def _questions(course_id: str, with_answers: bool) -> list[dict]:
    """Assemble questions with their options from the normalized answers."""
    cursor = db.questions.find(
        {"course_id": course_id, "test_type": TEST_TYPE},
        {"_id": 0, "created_at": 0, "updated_at": 0},
    ).sort("order", 1)
    questions = await cursor.to_list(length=200)

    result = []
    for q in questions:
        answers = await (
            db.answers.find({"question_id": q["question_id"]}, {"_id": 0})
            .sort("order", 1)
            .to_list(length=50)
        )
        options = [a["text"] for a in answers]
        correct_index = next(
            (i for i, a in enumerate(answers) if a["is_correct"]), -1
        )
        item = {
            "question_id": q["question_id"],
            "course_id": q["course_id"],
            "test_type": q["test_type"],
            "order": q["order"],
            "text": q["text"],
            "options": options,
        }
        if with_answers:
            item["correct_index"] = correct_index
        result.append(item)
    return result


def _result_response(result: dict) -> dict:
    """Public shape returned by submit + result + GET attempt (unchanged)."""
    return {
        "attempt_id": result["attempt_id"],
        "user_id": result["user_id"],
        "course_id": result["course_id"],
        "test_type": result["test_type"],
        "answers": result["answers"],
        "score": result["score"],
        "total": result["total"],
        "percentage": result["percentage"],
        "review": result["review"],
        "completed_at": result["completed_at"],
    }


@router.get("/{course_id}/pre-test")
async def get_pre_test(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    title = await _require_course_title(course_id)
    questions = await _questions(course_id, with_answers=False)
    result = await _existing_result(user.user_id, course_id)
    return {
        "course_id": course_id,
        "course_title": title,
        "test_type": TEST_TYPE,
        "total_questions": len(questions),
        "questions": questions,
        "attempt": _result_response(result) if result else None,
    }


@router.post("/{course_id}/pre-test/submit")
async def submit_pre_test(
    course_id: str,
    payload: SubmitTestRequest,
    user: UserPublic = Depends(require_role("STUDENT")),
):
    await _require_course_title(course_id)
    if await _existing_result(user.user_id, course_id):
        raise HTTPException(status_code=409, detail="already_attempted")

    questions = await _questions(course_id, with_answers=True)
    if not questions:
        raise HTTPException(status_code=404, detail="no_questions")

    review = []
    score = 0
    for q in questions:
        selected = payload.answers.get(q["question_id"])
        if selected is not None and not (0 <= selected < len(q["options"])):
            raise HTTPException(
                status_code=422, detail=f"invalid_option:{q['question_id']}"
            )
        is_correct = selected == q["correct_index"]
        score += int(is_correct)
        review.append(
            {
                "question_id": q["question_id"],
                "order": q["order"],
                "text": q["text"],
                "options": q["options"],
                "selected_index": selected,
                "correct_index": q["correct_index"],
                "is_correct": is_correct,
            }
        )

    total = len(questions)
    percentage = round(score / total * 100) if total else 0
    now = utcnow()
    test_id = f"{course_id}_pre_test"

    attempt_id = gen_id("att")
    await db.test_attempts.insert_one(
        {
            "attempt_id": attempt_id,
            "user_id": user.user_id,
            "test_id": test_id,
            "course_id": course_id,
            "test_type": TEST_TYPE,
            "status": "submitted",
            "started_at": now,
            "completed_at": now,
            "created_at": now,
            "updated_at": now,
        }
    )

    result_doc = {
        "result_id": gen_id("res"),
        "attempt_id": attempt_id,
        "user_id": user.user_id,
        "test_id": test_id,
        "course_id": course_id,
        "test_type": TEST_TYPE,
        "answers": payload.answers,
        "score": score,
        "total": total,
        "percentage": percentage,
        "passed": percentage >= PRE_TEST_PASSING_SCORE,
        "review": review,
        "completed_at": now,
        "created_at": now,
        "updated_at": now,
    }
    await db.test_results.insert_one(dict(result_doc))

    await db.course_progress.update_one(
        {"user_id": user.user_id, "course_id": course_id},
        {
            "$addToSet": {"completed_modules": TEST_TYPE},
            "$set": {"updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return _result_response(result_doc)


@router.get("/{course_id}/pre-test/result")
async def get_pre_test_result(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    await _require_course_title(course_id)
    result = await _existing_result(user.user_id, course_id)
    if not result:
        raise HTTPException(status_code=404, detail="no_attempt")
    return _result_response(result)


@router.post("/{course_id}/pre-test/reset")
async def reset_pre_test(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    await _require_course_title(course_id)
    await db.test_results.delete_many(
        {"user_id": user.user_id, "course_id": course_id, "test_type": TEST_TYPE}
    )
    await db.test_attempts.delete_many(
        {"user_id": user.user_id, "course_id": course_id, "test_type": TEST_TYPE}
    )
    return {"ok": True, "message": "Pre-test reset successfully"}
