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


@router.get("/leaderboard")
async def student_leaderboard(user: UserPublic = Depends(require_role("STUDENT"))):
    students = await db.users.find({"role": "STUDENT"}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1}).to_list(length=100)
    user_ids = [s["user_id"] for s in students]
    results = await db.test_results.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "percentage": 1, "score": 1}).to_list(length=500)
    
    score_by_user: dict[str, int] = {}
    tests_by_user: dict[str, int] = {}
    for r in results:
        uid = r["user_id"]
        score_by_user[uid] = score_by_user.get(uid, 0) + r.get("percentage", 0)
        tests_by_user[uid] = tests_by_user.get(uid, 0) + 1
        
    leaderboard = []
    for s in students:
        uid = s["user_id"]
        total_score = score_by_user.get(uid, 0)
        count = tests_by_user.get(uid, 0)
        avg = round(total_score / count) if count > 0 else 0
        points = total_score + (count * 50)
        leaderboard.append({
            "user_id": uid,
            "name": s["name"],
            "picture": s.get("picture"),
            "total_points": points,
            "avg_score": avg,
            "tests_completed": count,
            "is_current_user": uid == user.user_id,
        })
        
    leaderboard.sort(key=lambda x: (x["total_points"], x["avg_score"]), reverse=True)
    for idx, item in enumerate(leaderboard):
        item["rank"] = idx + 1
        
    return {"leaderboard": leaderboard[:15]}


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


@router.get("/admin/users")
async def admin_users(user: UserPublic = Depends(require_role("ADMIN"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(length=200)
    # Ensure datetime serialization
    serialized = []
    for u in users:
        item = dict(u)
        if "created_at" in item and hasattr(item["created_at"], "isoformat"):
            item["created_at"] = item["created_at"].isoformat()
        if "updated_at" in item and hasattr(item["updated_at"], "isoformat"):
            item["updated_at"] = item["updated_at"].isoformat()
        serialized.append(item)
    return {"users": serialized}


@router.get("/admin/courses")
async def admin_courses(user: UserPublic = Depends(require_role("ADMIN"))):
    courses = await list_active_courses()
    total_students = await db.users.count_documents({"role": "STUDENT"})
    result = []
    for c in courses:
        cid = c["course_id"]
        enrolled = await db.course_progress.count_documents({"course_id": cid})
        completed = await db.course_progress.count_documents(
            {"course_id": cid, "completed_modules": "results"}
        )
        result.append(
            {
                "id": cid,
                "title": c["title"],
                "total_modules": len(MODULES),
                "enrolled_count": enrolled or total_students,
                "completed_count": completed,
                "status": "active",
            }
        )
    return {"courses": result}


@router.get("/admin/analytics")
async def admin_analytics(user: UserPublic = Depends(require_role("ADMIN"))):
    results = await db.test_results.find({}, {"_id": 0}).to_list(length=1000)
    avg_score = round(sum(r.get("percentage", 0) for r in results) / len(results)) if results else 0
    total_attempts = len(results)
    pre_test_count = sum(1 for r in results if r.get("test_type") == "pre_test")
    post_test_count = sum(1 for r in results if r.get("test_type") == "post_test")

    course_stats = []
    for c in await list_active_courses():
        cid = c["course_id"]
        c_res = [r for r in results if r.get("course_id") == cid]
        c_avg = round(sum(r.get("percentage", 0) for r in c_res) / len(c_res)) if c_res else 0
        course_stats.append({
            "course_id": cid,
            "title": c["title"],
            "attempts": len(c_res),
            "avg_score": c_avg,
        })

    return {
        "summary": {
            "avg_score": avg_score,
            "total_attempts": total_attempts,
            "pre_test_count": pre_test_count,
            "post_test_count": post_test_count,
        },
        "course_stats": course_stats,
    }


@router.get("/admin/reports")
async def admin_reports(user: UserPublic = Depends(require_role("ADMIN"))):
    results = await db.test_results.find({}, {"_id": 0}).sort("completed_at", -1).limit(50).to_list(length=50)
    course_titles = {c["course_id"]: c["title"] for c in await list_active_courses()}
    user_ids = list({r["user_id"] for r in results})
    user_docs = await db.users.find({"user_id": {"$in": user_ids}}, {"_id": 0, "user_id": 1, "name": 1, "email": 1}).to_list(length=100)
    user_map = {u["user_id"]: u for u in user_docs}

    reports = []
    for r in results:
        u = user_map.get(r["user_id"], {"name": "Siswa", "email": "-"})
        cat = r.get("completed_at")
        reports.append({
            "id": r.get("result_id", ""),
            "user_name": u.get("name", "Siswa"),
            "user_email": u.get("email", "-"),
            "course_title": course_titles.get(r.get("course_id"), r.get("course_id")),
            "test_type": r.get("test_type", "pre_test"),
            "score": r.get("score", 0),
            "total": r.get("total", 5),
            "percentage": r.get("percentage", 0),
            "completed_at": cat.isoformat() if hasattr(cat, "isoformat") else str(cat),
        })
    return {"reports": reports}

