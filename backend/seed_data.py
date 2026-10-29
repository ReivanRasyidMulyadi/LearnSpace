"""Seed the normalized LearnSpace schema with real catalog content.

Idempotent: safe to run on every startup. Loads official curriculum
for 5 PTI UNESA courses from kurikulum.json into normalized collections.
"""
from __future__ import annotations

import json
import logging
import os
import re

from db import db
from db_models import utcnow

logger = logging.getLogger(__name__)

KURIKULUM_PATH = os.path.join(os.path.dirname(__file__), "kurikulum.json")

# Course slug mappings
SLUG_MAP: dict[str, str] = {
    "MK-EBP-8320702121": "ebp",
    "MK-IMK-8320702021": "imk",
    "MK-PMO-8320703062": "pmo",
    "MK-PVI-8320703063": "pvi",
    "MK-STD-8320702122": "std",
}

OLD_COURSES: list[str] = ["math", "science", "english", "history"]

# Stable course ids for external references
COURSES: dict[str, str] = {
    "ebp": "Evaluasi Belajar dan Pembelajaran",
    "imk": "Interaksi Manusia dan Komputer",
    "pmo": "Pemrograman Mobile",
    "pvi": "Pemrograman Visual",
    "std": "Struktur Data",
}

# Ordered learning flow. Pre-test is the gate for everything after it.
MODULES: list[dict] = [
    {"key": "pre_test", "title": "Pre-Test", "description": "Ukur pengetahuan awalmu.", "icon": "clipboard"},
    {"key": "materials", "title": "Materi", "description": "Baca materi inti pembelajaran.", "icon": "document-text"},
    {"key": "videos", "title": "Video", "description": "Tonton video penjelasan.", "icon": "videocam"},
    {"key": "manual_book", "title": "Manual Book", "description": "Unduh buku panduan PDF.", "icon": "book"},
    {"key": "discussion", "title": "Diskusi", "description": "Berdiskusi dengan dosen dan teman.", "icon": "chatbubbles"},
    {"key": "post_test", "title": "Post-Test", "description": "Uji pemahaman akhir.", "icon": "checkbox"},
    {"key": "results", "title": "Hasil", "description": "Lihat hasil dan sertifikat.", "icon": "trophy"},
]

PRE_TEST_PASSING_SCORE = 60
LETTER_MAP = {"A": 0, "B": 1, "C": 2, "D": 3}


def _parse_duration(duration_str: str) -> int:
    parts = duration_str.strip().split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + int(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
    return 300


def _load_kurikulum_data() -> list[dict]:
    if os.path.exists(KURIKULUM_PATH):
        with open(KURIKULUM_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("courses", [])
    return []


async def _purge_legacy_courses() -> None:
    """Safely purge legacy dummy courses and their related entities."""
    count_legacy = await db.courses.count_documents({"course_id": {"$in": OLD_COURSES}})
    if count_legacy == 0:
        return

    for old_id in OLD_COURSES:
        try:
            discs = await db.discussions.find({"course_id": old_id}, {"_id": 0, "discussion_id": 1}).to_list(length=1000)
            disc_ids = [d["discussion_id"] for d in discs if "discussion_id" in d]
            if disc_ids:
                await db.comments.delete_many({"discussion_id": {"$in": disc_ids}})
            await db.discussions.delete_many({"course_id": old_id})
        except Exception as e:
            logger.warning("Error purging discussions/comments for %s: %s", old_id, e)

        await db.courses.delete_many({"course_id": old_id})
        await db.tests.delete_many({"course_id": old_id})
        await db.questions.delete_many({"course_id": old_id})
        await db.answers.delete_many({"question_id": {"$regex": f"^{old_id}_"}})
        await db.materials.delete_many({"course_id": old_id})
        await db.videos.delete_many({"course_id": old_id})
        await db.manual_books.delete_many({"course_id": old_id})
        await db.test_attempts.delete_many({"course_id": old_id})
        await db.test_results.delete_many({"course_id": old_id})


async def _seed_courses(raw_courses: list[dict]) -> None:
    existing_courses = await db.courses.count_documents({})
    if existing_courses >= len(raw_courses):
        return

    now = utcnow()
    for idx, c in enumerate(raw_courses):
        course_id = SLUG_MAP.get(c["course_id"])
        if not course_id:
            continue
        order = idx + 1
        description = c.get("description", "")
        title = c["title"]

        await db.courses.update_one(
            {"course_id": course_id},
            {
                "$set": {
                    "slug": course_id,
                    "title": title,
                    "description": description,
                    "order": order,
                    "updated_at": now,
                },
                "$setOnInsert": {"course_id": course_id, "created_at": now},
            },
            upsert=True,
        )


async def _seed_tests_questions_answers(raw_courses: list[dict]) -> None:
    """Seed pre-test and post-test questions and answers derived from meetings."""
    expected_questions = len(raw_courses) * 12
    existing_questions = await db.questions.count_documents({})
    if existing_questions >= expected_questions:
        return

    now = utcnow()
    for c in raw_courses:
        course_id = SLUG_MAP.get(c["course_id"])
        if not course_id:
            continue
        meetings = c.get("meetings", [])

        # Question 1 of each meeting -> Pre-Test (6 questions)
        # Question 2 of each meeting -> Post-Test (6 questions)
        pre_items: list[tuple[str, list[str], int]] = []
        post_items: list[tuple[str, list[str], int]] = []

        for m in sorted(meetings, key=lambda x: x["meeting_number"]):
            quizzes = m.get("quiz", [])
            if len(quizzes) >= 1:
                q1 = quizzes[0]
                q1_ans = LETTER_MAP.get(q1["answer"].strip().upper(), 0)
                q1_opts = [re.sub(r"^[A-D]\.\s*", "", opt) for opt in q1["options"]]
                pre_items.append((q1["question"], q1_opts, q1_ans))
            if len(quizzes) >= 2:
                q2 = quizzes[1]
                q2_ans = LETTER_MAP.get(q2["answer"].strip().upper(), 0)
                q2_opts = [re.sub(r"^[A-D]\.\s*", "", opt) for opt in q2["options"]]
                post_items.append((q2["question"], q2_opts, q2_ans))

        for test_type, items, passing_score, test_order in [
            ("pre_test", pre_items, PRE_TEST_PASSING_SCORE, 1),
            ("post_test", post_items, 70, 2),
        ]:
            if not items:
                continue

            test_id = f"{course_id}_{test_type}"
            type_label = "Pre-Test" if test_type == "pre_test" else "Post-Test"
            desc = (
                f"Ukur pengetahuan awalmu tentang {c['title']}."
                if test_type == "pre_test"
                else f"Uji pemahaman akhirmu tentang materi {c['title']}."
            )

            await db.tests.update_one(
                {"course_id": course_id, "test_type": test_type},
                {
                    "$set": {
                        "test_id": test_id,
                        "title": f"{type_label} {c['title']}",
                        "description": desc,
                        "passing_score": passing_score,
                        "total_questions": len(items),
                        "order": test_order,
                        "updated_at": now,
                    },
                    "$setOnInsert": {"created_at": now},
                },
                upsert=True,
            )

            prefix = "pre" if test_type == "pre_test" else "post"
            expected_answers = sum(len(opts) for _, opts, _ in items)
            existing_answers = await db.answers.count_documents(
                {"question_id": {"$regex": f"^{course_id}_{prefix}_"}}
            )
            existing_questions = await db.questions.count_documents(
                {"course_id": course_id, "test_type": test_type}
            )

            sample = await db.questions.find_one(
                {"course_id": course_id, "test_type": test_type}
            )
            already_normalized = sample is not None and "options" not in sample
            if (
                already_normalized
                and existing_questions == len(items)
                and existing_answers == expected_answers
            ):
                continue

            q_ids = [f"{course_id}_{prefix}_{i + 1}" for i in range(len(items))]
            await db.answers.delete_many({"question_id": {"$in": q_ids}})
            await db.questions.delete_many(
                {"course_id": course_id, "test_type": test_type}
            )

            question_docs = []
            answer_docs = []
            for i, (text, options, correct) in enumerate(items):
                question_id = q_ids[i]
                question_docs.append(
                    {
                        "question_id": question_id,
                        "test_id": test_id,
                        "course_id": course_id,
                        "test_type": test_type,
                        "order": i + 1,
                        "text": text,
                        "created_at": now,
                        "updated_at": now,
                    }
                )
                for j, option_text in enumerate(options):
                    answer_docs.append(
                        {
                            "answer_id": f"{question_id}_a{j + 1}",
                            "question_id": question_id,
                            "order": j + 1,
                            "text": option_text,
                            "is_correct": j == correct,
                            "created_at": now,
                            "updated_at": now,
                        }
                    )
            if question_docs:
                await db.questions.insert_many(question_docs)
            if answer_docs:
                await db.answers.insert_many(answer_docs)
            logger.info("Seeded normalized %s for %s (%d questions)", test_type, course_id, len(question_docs))


async def _seed_learning_content(raw_courses: list[dict]) -> None:
    """Seed real materials (6 meetings), videos (12 per course), and manual books."""
    expected_mats = sum(len(c.get("meetings", [])) for c in raw_courses)
    expected_vids = sum(len(m.get("videos", [])) for c in raw_courses for m in c.get("meetings", []))
    existing_mats = await db.materials.count_documents({})
    existing_vids = await db.videos.count_documents({})
    if existing_mats >= expected_mats and existing_vids >= expected_vids:
        return

    now = utcnow()
    for c in raw_courses:
        course_id = SLUG_MAP.get(c["course_id"])
        if not course_id:
            continue
        meetings = sorted(c.get("meetings", []), key=lambda x: x["meeting_number"])

        # 1. Materials per meeting
        for m in meetings:
            m_num = m["meeting_number"]
            m_title = m.get("title", f"Pertemuan {m_num}")
            m_desc = m.get("sub_cpmk") or f"Materi Pertemuan {m_num} - {c['title']}"
            m_content = m.get("material_content", "")

            await db.materials.update_one(
                {"material_id": f"{course_id}_mat_{m_num}"},
                {
                    "$set": {
                        "course_id": course_id,
                        "title": m_title,
                        "description": m_desc,
                        "content": m_content,
                        "order": m_num,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "material_id": f"{course_id}_mat_{m_num}",
                        "created_at": now,
                    },
                },
                upsert=True,
            )

        # 2. Videos per meeting (2 videos each)
        video_order = 1
        for m in meetings:
            for v in m.get("videos", []):
                vid_id = f"{course_id}_vid_{video_order}"
                v_title = v.get("title", f"Video {video_order}")
                v_channel = v.get("channel", "E-Learning UNESA")
                v_desc = f"Pertemuan {m['meeting_number']} - Kanal: {v_channel}"
                v_url = v.get("embed_url") or v.get("url") or "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                v_dur = _parse_duration(v.get("duration", "05:00"))

                await db.videos.update_one(
                    {"video_id": vid_id},
                    {
                        "$set": {
                            "course_id": course_id,
                            "title": v_title,
                            "description": v_desc,
                            "url": v_url,
                            "duration_seconds": v_dur,
                            "order": video_order,
                            "updated_at": now,
                        },
                        "$setOnInsert": {
                            "video_id": vid_id,
                            "created_at": now,
                        },
                    },
                    upsert=True,
                )
                video_order += 1

        # 3. Manual Book / RPS
        sks = c.get("credits_sks", 2)
        await db.manual_books.update_one(
            {"book_id": f"{course_id}_book"},
            {
                "$set": {
                    "course_id": course_id,
                    "title": f"Buku Panduan & RPS {c['title']}",
                    "description": f"Rencana Pembelajaran Semester (RPS) dan Modul Kuliah {c['title']} ({sks} SKS) - UNESA S1 PTI.",
                    "file_url": "https://www.africau.edu/images/default/sample.pdf",
                    "pages": 32,
                    "updated_at": now,
                },
                "$setOnInsert": {"book_id": f"{course_id}_book", "created_at": now},
            },
            upsert=True,
        )


async def _seed_default_accounts() -> None:
    now = utcnow()
    admin_exists = await db.users.find_one({"email": "admin@learnspace.app"})
    if not admin_exists:
        import bcrypt

        pw_hash = bcrypt.hashpw(b"Admin@123", bcrypt.gensalt()).decode("utf-8")
        await db.users.insert_one(
            {
                "user_id": "user_admin_001",
                "email": "admin@learnspace.app",
                "name": "Administrator",
                "role": "ADMIN",
                "password_hash": pw_hash,
                "created_at": now,
                "updated_at": now,
            }
        )
        await db.profiles.insert_one(
            {
                "profile_id": "prof_admin_001",
                "user_id": "user_admin_001",
                "bio": "Administrator Utama LearnSpace",
                "school": "UNESA S1 PTI",
                "grade": "Dosen / Staff",
                "created_at": now,
                "updated_at": now,
            }
        )

    student_exists = await db.users.find_one({"email": "student@learnspace.app"})
    if not student_exists:
        import bcrypt

        pw_hash = bcrypt.hashpw(b"Student@123", bcrypt.gensalt()).decode("utf-8")
        await db.users.insert_one(
            {
                "user_id": "user_student_001",
                "email": "student@learnspace.app",
                "name": "Mahasiswa PTI",
                "role": "STUDENT",
                "password_hash": pw_hash,
                "created_at": now,
                "updated_at": now,
            }
        )
        await db.profiles.insert_one(
            {
                "profile_id": "prof_student_001",
                "user_id": "user_student_001",
                "bio": "Mahasiswa aktif S1 Pendidikan Teknologi Informasi",
                "school": "Universitas Negeri Surabaya",
                "grade": "Semester 4",
                "created_at": now,
                "updated_at": now,
            }
        )


async def seed_database() -> None:
    """Master seeder for the normalized catalog."""
    await _seed_default_accounts()
    await _purge_legacy_courses()
    raw_courses = _load_kurikulum_data()
    if raw_courses:
        await _seed_courses(raw_courses)
        await _seed_tests_questions_answers(raw_courses)
        await _seed_learning_content(raw_courses)
        logger.info("LearnSpace catalog seeded with %d courses from kurikulum.json", len(raw_courses))
    else:
        logger.warning("No courses found in kurikulum.json to seed")
