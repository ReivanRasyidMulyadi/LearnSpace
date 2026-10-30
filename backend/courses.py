"""Course catalog + per-student module unlock state.

Courses live in the normalized `courses` collection. Pre-test completion
unlocks the rest of the learning flow (tracked in `course_progress`).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import require_role
from db import db
from models import UserPublic
from seed_data import MODULES

router = APIRouter(prefix="/courses", tags=["courses"])



async def get_course(course_id: str) -> Optional[dict]:
    return await db.courses.find_one({"course_id": course_id}, {"_id": 0})


async def list_active_courses() -> list[dict]:
    cursor = db.courses.find({}, {"_id": 0}).sort("order", 1)
    return await cursor.to_list(length=100)


async def build_course_progress(user_id: str, course_id: str) -> dict:
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")

    doc = await db.course_progress.find_one(
        {"user_id": user_id, "course_id": course_id}, {"_id": 0}
    )
    completed = set((doc or {}).get("completed_modules", []))
    if "pre_test" not in completed:
        if await db.test_results.find_one({"user_id": user_id, "course_id": course_id, "test_type": "pre_test"}):
            completed.add("pre_test")
    if "post_test" not in completed:
        if await db.test_results.find_one({"user_id": user_id, "course_id": course_id, "test_type": "post_test"}):
            completed.add("post_test")
    pre_test_done = "pre_test" in completed

    modules = []
    next_module = None
    for m in MODULES:
        is_completed = m["key"] in completed
        locked = m["key"] != "pre_test" and not pre_test_done
        if next_module is None and not locked and not is_completed:
            next_module = m["key"]
        modules.append({**m, "locked": locked, "completed": is_completed})

    return {
        "course_id": course_id,
        "title": course["title"],
        "pre_test_completed": pre_test_done,
        "completed_count": len(completed),
        "total_modules": len(MODULES),
        "progress_percent": round(len(completed) / len(MODULES) * 100),
        "next_module": next_module,
        "modules": modules,
    }


@router.get("")
async def list_courses(user: UserPublic = Depends(require_role("STUDENT"))):
    items = []
    for course in await list_active_courses():
        course_id = course["course_id"]
        p = await build_course_progress(user.user_id, course_id)
        items.append(
            {
                "id": course_id,
                "title": course["title"],
                "progress": p["progress_percent"],
                "pre_test_completed": p["pre_test_completed"],
                "total_modules": p["total_modules"],
            }
        )
    return {"courses": items}


@router.get("/{course_id}/progress")
async def course_progress(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    return await build_course_progress(user.user_id, course_id)


@router.post("/{course_id}/modules/{module_key}/complete")
async def complete_module(
    course_id: str, module_key: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.course_progress.update_one(
        {"user_id": user.user_id, "course_id": course_id},
        {
            "$addToSet": {"completed_modules": module_key},
            "$set": {"updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return await build_course_progress(user.user_id, course_id)


@router.get("/{course_id}/materials")
async def get_course_materials(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")
    items = await db.materials.find(
        {"course_id": course_id}, {"_id": 0}
    ).sort("order", 1).to_list(length=50)
    return {"course_id": course_id, "materials": items}


@router.get("/{course_id}/videos")
async def get_course_videos(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")
    items = await db.videos.find(
        {"course_id": course_id}, {"_id": 0}
    ).sort("order", 1).to_list(length=50)
    return {"course_id": course_id, "videos": items}


@router.get("/{course_id}/manual-book")
async def get_course_manual_book(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")
    book = await db.manual_books.find_one({"course_id": course_id}, {"_id": 0})
    return {"course_id": course_id, "manual_book": book}


class PostTestSubmission(BaseModel):
    answers: dict[str, int]


@router.get("/{course_id}/post-test")
async def get_post_test(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")

    questions = await db.questions.find(
        {"course_id": course_id, "test_type": "post_test"},
        {"_id": 0, "created_at": 0, "updated_at": 0},
    ).sort("order", 1).to_list(length=100)

    public_q = []
    for q in questions:
        answers = await db.answers.find(
            {"question_id": q["question_id"]}, {"_id": 0}
        ).sort("order", 1).to_list(length=50)
        public_q.append(
            {
                "question_id": q["question_id"],
                "text": q["text"],
                "options": [a["text"] for a in answers],
            }
        )

    return {
        "course_id": course_id,
        "course_title": course["title"],
        "questions": public_q,
    }


@router.post("/{course_id}/post-test/submit")
async def submit_post_test(
    course_id: str,
    payload: PostTestSubmission,
    user: UserPublic = Depends(require_role("STUDENT")),
):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")

    questions = await db.questions.find(
        {"course_id": course_id, "test_type": "post_test"},
        {"_id": 0, "created_at": 0, "updated_at": 0},
    ).sort("order", 1).to_list(length=100)

    if not questions:
        raise HTTPException(status_code=404, detail="no_questions_found")

    score = 0
    review = []
    for q in questions:
        qid = q["question_id"]
        answers = await db.answers.find(
            {"question_id": qid}, {"_id": 0}
        ).sort("order", 1).to_list(length=50)

        options = [a["text"] for a in answers]
        correct_idx = next(
            (i for i, a in enumerate(answers) if a.get("is_correct")), 0
        )
        user_ans = payload.answers.get(qid)
        is_corr = user_ans == correct_idx
        if is_corr:
            score += 1

        review.append(
            {
                "question_id": qid,
                "text": q["text"],
                "options": options,
                "selected_index": user_ans,
                "correct_index": correct_idx,
                "is_correct": is_corr,
            }
        )

    total = len(questions)
    pct = round((score / total) * 100)
    now = datetime.now(timezone.utc)
    res_id = f"res_{uuid.uuid4().hex[:12]}"
    attempt_id = f"att_{uuid.uuid4().hex[:12]}"
    test_id = f"{course_id}_post_test"

    await db.test_attempts.insert_one(
        {
            "attempt_id": attempt_id,
            "user_id": user.user_id,
            "test_id": test_id,
            "course_id": course_id,
            "test_type": "post_test",
            "status": "submitted",
            "started_at": now,
            "completed_at": now,
            "created_at": now,
            "updated_at": now,
        }
    )

    result_doc = {
        "result_id": res_id,
        "attempt_id": attempt_id,
        "user_id": user.user_id,
        "test_id": test_id,
        "course_id": course_id,
        "test_type": "post_test",
        "answers": payload.answers,
        "score": score,
        "total": total,
        "percentage": pct,
        "passed": pct >= 70,
        "review": review,
        "completed_at": now,
        "created_at": now,
        "updated_at": now,
    }
    await db.test_results.insert_one(dict(result_doc))

    # Mark post_test and results as completed
    for mod in ["post_test", "results"]:
        await db.course_progress.update_one(
            {"user_id": user.user_id, "course_id": course_id},
            {
                "$addToSet": {"completed_modules": mod},
                "$set": {"updated_at": now.isoformat()},
                "$setOnInsert": {"created_at": now.isoformat()},
            },
            upsert=True,
        )

    return {
        "result_id": res_id,
        "course_id": course_id,
        "course_title": course["title"],
        "test_type": "post_test",
        "score": score,
        "total": total,
        "percentage": pct,
        "review": review,
        "completed_at": now.isoformat(),
    }


@router.get("/{course_id}/results")
async def get_course_results(
    course_id: str, user: UserPublic = Depends(require_role("STUDENT"))
):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")
    
    pre = await db.test_results.find_one(
        {"user_id": user.user_id, "course_id": course_id, "test_type": "pre_test"},
        {"_id": 0},
    )
    post = await db.test_results.find_one(
        {"user_id": user.user_id, "course_id": course_id, "test_type": "post_test"},
        {"_id": 0},
    )
    
    pre_score = pre.get("percentage", 0) if pre else 0
    post_score = post.get("percentage", 0) if post else 0
    growth = max(0, post_score - pre_score)

    return {
        "course_id": course_id,
        "course_title": course["title"],
        "student_name": user.name,
        "pre_test_score": pre_score,
        "post_test_score": post_score,
        "growth_percent": growth,
        "is_passed": post_score >= 60,
        "certificate_id": f"CERT-{course_id.upper()}-{user.user_id[-6:].upper()}",
        "issued_at": datetime.now(timezone.utc).strftime("%d %B %Y"),
    }
