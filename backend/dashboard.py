"""Dashboard endpoints for student and admin roles.

Student dashboard reflects real per-course progress. Admin overview reports
real counts from the normalized collections (no mock-only structures).
"""
from fastapi import APIRouter, Depends

from auth import require_role
from courses import build_course_progress, list_active_courses
from db import db
from models import UserPublic
from seed_data import MODULES

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

MODULE_TITLES = {m["key"]: m["title"] for m in MODULES}


@router.get("/student")
async def student_dashboard(user: UserPublic = Depends(require_role("STUDENT"))):
    subjects = []
    continue_learning = None
    for course in await list_active_courses():
        course_id = course["course_id"]
        p = await build_course_progress(user.user_id, course_id)
        subjects.append(
            {
                "id": course_id,
                "title": course["title"],
                "progress": p["progress_percent"],
                "pre_test_completed": p["pre_test_completed"],
            }
        )
        if continue_learning is None and p["next_module"]:
            continue_learning = {
                "course_id": course_id,
                "title": course["title"],
                "progress": p["progress_percent"],
                "next_module": p["next_module"],
                "next_module_title": MODULE_TITLES[p["next_module"]],
            }

    return {
        "greeting": f"Selamat datang, {user.name.split(' ')[0]}",
        "streak_days": 0,
        "badges_earned": 0,
        "continue_learning": continue_learning,
        "subjects": subjects,
    }


@router.get("/admin/overview")
async def admin_overview(user: UserPublic = Depends(require_role("ADMIN"))):
    total_students = await db.users.count_documents({"role": "STUDENT"})
    active_courses = await db.courses.count_documents({})

    total_modules = len(MODULES)
    progress_docs = await db.course_progress.find(
        {}, {"_id": 0, "completed_modules": 1}
    ).to_list(length=5000)
    if progress_docs:
        avg = sum(
            len(d.get("completed_modules", [])) / total_modules for d in progress_docs
        ) / len(progress_docs)
        completion_rate = round(avg * 100)
    else:
        completion_rate = 0

    pending_reviews = await db.discussions.count_documents({})

    course_titles = {c["course_id"]: c["title"] for c in await list_active_courses()}
    recent = await (
        db.test_results.find(
            {}, {"_id": 0, "result_id": 1, "course_id": 1, "percentage": 1, "completed_at": 1}
        )
        .sort("completed_at", -1)
        .limit(5)
        .to_list(length=5)
    )
    recent_activity = [
        {
            "id": r["result_id"],
            "label": f"Pre-Test {course_titles.get(r['course_id'], r['course_id'])} selesai ({r['percentage']}%)",
            "at": r["completed_at"].isoformat(),
        }
        for r in recent
    ]

    return {
        "metrics": {
            "total_students": total_students,
            "active_courses": active_courses,
            "completion_rate": completion_rate,
            "pending_reviews": pending_reviews,
        },
        "recent_activity": recent_activity,
    }
