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

POST_TEST_QUESTIONS: dict[str, list[dict]] = {
    "math": [
        {"id": "math_post_1", "text": "Berapakah hasil dari 25% dari 240?", "options": ["50", "60", "70", "80"], "correct_index": 1},
        {"id": "math_post_2", "text": "Jika sebuah segitiga memiliki alas 12 cm dan tinggi 8 cm, maka luasnya adalah ...", "options": ["48 cm²", "96 cm²", "36 cm²", "24 cm²"], "correct_index": 0},
        {"id": "math_post_3", "text": "Faktor persekutuan terbesar (FPB) dari 24 dan 36 adalah ...", "options": ["6", "8", "12", "18"], "correct_index": 2},
        {"id": "math_post_4", "text": "Hasil dari (-8) + 15 - 4 adalah ...", "options": ["1", "3", "-3", "7"], "correct_index": 1},
        {"id": "math_post_5", "text": "Sebuah mobil menempuh 180 km dalam waktu 3 jam. Berapakah kecepatan rata-ratanya?", "options": ["50 km/jam", "60 km/jam", "70 km/jam", "80 km/jam"], "correct_index": 1},
    ],
    "science": [
        {"id": "sci_post_1", "text": "Zat yang berfungsi mengikat dan membawa oksigen dalam sel darah merah adalah ...", "options": ["Leukosit", "Trombosit", "Hemoglobin", "Plasma"], "correct_index": 2},
        {"id": "sci_post_2", "text": "Perubahan wujud benda dari padat langsung menjadi gas dinamakan ...", "options": ["Mencair", "Mengembun", "Menyublim", "Menguap"], "correct_index": 2},
        {"id": "sci_post_3", "text": "Unit terkecil dari makhluk hidup penyusun tubuh disebut ...", "options": ["Jaringan", "Organ", "Sel", "Sistem organ"], "correct_index": 2},
        {"id": "sci_post_4", "text": "Energi yang dihasilkan dari aliran muatan elektron disebut ...", "options": ["Energi kinetik", "Energi listrik", "Energi kimia", "Energi potensial"], "correct_index": 1},
        {"id": "sci_post_5", "text": "Lapisan atmosfer tempat terjadinya fenomena cuaca (hujan, angin, awan) adalah ...", "options": ["Troposfer", "Stratosfer", "Mesosfer", "Termosfer"], "correct_index": 0},
    ],
    "english": [
        {"id": "eng_post_1", "text": "They ___ basketball in the court every Saturday afternoon.", "options": ["play", "plays", "playing", "played"], "correct_index": 0},
        {"id": "eng_post_2", "text": "The comparative form of the adjective 'good' is ...", "options": ["gooder", "best", "better", "more good"], "correct_index": 2},
        {"id": "eng_post_3", "text": "What is the closest synonym of the word 'difficult'?", "options": ["Easy", "Hard", "Simple", "Quick"], "correct_index": 1},
        {"id": "eng_post_4", "text": "'Where do you live?' — This question is inquiring about ...", "options": ["Time", "Place", "Age", "Name"], "correct_index": 1},
        {"id": "eng_post_5", "text": "She has lived here ___ five years.", "options": ["since", "for", "during", "at"], "correct_index": 1},
    ],
    "history": [
        {"id": "hist_post_1", "text": "Konferensi Meja Bundar (KMB) tahun 1949 diselenggarakan di kota ...", "options": ["Jakarta", "Den Haag", "Yogyakarta", "Bandung"], "correct_index": 1},
        {"id": "hist_post_2", "text": "Surat kabar tertua pembawa semangat nasionalisme yang dipimpin Tirto Adhi Soerjo adalah ...", "options": ["De Express", "Medan Prijaji", "Fajar Asia", "Indonesia Merdeka"], "correct_index": 1},
        {"id": "hist_post_3", "text": "Candi Borobudur di Jawa Tengah merupakan mahakarya peninggalan Dinasti ...", "options": ["Syailendra", "Sanjaya", "Isyana", "Kertanegara"], "correct_index": 0},
        {"id": "hist_post_4", "text": "Sumpah Palapa untuk mempersatukan Nusantara diucapkan oleh Mahapatih ...", "options": ["Hayam Wuruk", "Gajah Mada", "Raden Wijaya", "Kertanegara"], "correct_index": 1},
        {"id": "hist_post_5", "text": "Tujuan utama pemuda membawa Soekarno-Hatta ke Rengasdengklok adalah ...", "options": ["Menjauhkan dari pengaruh Jepang", "Menyusun strategi perang", "Menyerah kepada Sekutu", "Membentuk kabinet baru"], "correct_index": 0},
    ],
}


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


class PostTestSubmission(BaseModel):
    answers: dict[str, int]


@router.get("/{course_id}/post-test")
async def get_post_test(course_id: str, user: UserPublic = Depends(require_role("STUDENT"))):
    course = await get_course(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="course_not_found")
    questions = POST_TEST_QUESTIONS.get(course_id, POST_TEST_QUESTIONS["math"])
    public_q = [
        {"question_id": q["id"], "text": q["text"], "options": q["options"]}
        for q in questions
    ]
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
    
    questions = POST_TEST_QUESTIONS.get(course_id, POST_TEST_QUESTIONS["math"])
    score = 0
    review = []
    for q in questions:
        user_ans = payload.answers.get(q["id"])
        is_corr = user_ans == q["correct_index"]
        if is_corr:
            score += 1
        review.append({
            "question_id": q["id"],
            "text": q["text"],
            "options": q["options"],
            "selected_index": user_ans,
            "correct_index": q["correct_index"],
            "is_correct": is_corr,
        })
    
    total = len(questions)
    pct = round((score / total) * 100)
    now = datetime.now(timezone.utc)
    res_id = f"res_{uuid.uuid4().hex[:12]}"
    
    result_doc = {
        "result_id": res_id,
        "user_id": user.user_id,
        "course_id": course_id,
        "test_type": "post_test",
        "score": score,
        "total": total,
        "percentage": pct,
        "review": review,
        "completed_at": now,
        "created_at": now,
        "updated_at": now,
    }
    await db.test_results.insert_one(dict(result_doc))

    # Mark post_test and results as completed
    await db.course_progress.update_one(
        {"user_id": user.user_id, "course_id": course_id},
        {
            "$addToSet": {"completed_modules": {"$each": ["post_test", "results"]}},
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
