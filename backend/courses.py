"""Course catalog + per-student module unlock state.

Courses now live in the normalized `courses` collection. Pre-test completion
unlocks the rest of the learning flow (tracked in `course_progress`).
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

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
