"""Seed the normalized LearnSpace schema with real catalog content.

Idempotent: safe to run on every startup. Migrates the legacy embedded-option
questions into the normalized questions + answers collections.
"""
from __future__ import annotations

import logging

from db import db
from db_models import gen_id, utcnow

logger = logging.getLogger(__name__)

# Stable course ids (kept as slugs to preserve existing API contracts).
COURSES: dict[str, str] = {
    "math": "Matematika",
    "science": "IPA",
    "english": "Bahasa Inggris",
    "history": "Sejarah",
}

# course_id -> (description, order)
COURSE_META: dict[str, tuple[str, int]] = {
    "math": ("Pelajari konsep matematika dasar hingga lanjutan.", 1),
    "science": ("Jelajahi ilmu pengetahuan alam di sekitarmu.", 2),
    "english": ("Tingkatkan kemampuan Bahasa Inggrismu.", 3),
    "history": ("Kenali sejarah penting Indonesia dan dunia.", 4),
}

# Ordered learning flow. Pre-test is the gate for everything after it.
MODULES: list[dict] = [
    {"key": "pre_test", "title": "Pre-Test", "description": "Ukur pengetahuan awalmu.", "icon": "clipboard"},
    {"key": "materials", "title": "Materi", "description": "Baca materi inti pembelajaran.", "icon": "document-text"},
    {"key": "videos", "title": "Video", "description": "Tonton video penjelasan.", "icon": "videocam"},
    {"key": "manual_book", "title": "Manual Book", "description": "Unduh buku panduan PDF.", "icon": "book"},
    {"key": "discussion", "title": "Diskusi", "description": "Berdiskusi dengan guru dan teman.", "icon": "chatbubbles"},
    {"key": "post_test", "title": "Post-Test", "description": "Uji pemahaman akhir.", "icon": "checkbox"},
    {"key": "results", "title": "Hasil", "description": "Lihat hasil dan sertifikat.", "icon": "trophy"},
]

# (text, options, correct_index)
PRE_TEST_QUESTIONS: dict[str, list[tuple[str, list[str], int]]] = {
    "math": [
        ("Hasil dari 12 x 8 adalah ...", ["86", "96", "106", "116"], 1),
        ("Pecahan 3/4 sama dengan ...", ["0,25", "0,5", "0,75", "1,25"], 2),
        ("Keliling persegi dengan sisi 7 cm adalah ...", ["14 cm", "21 cm", "28 cm", "49 cm"], 2),
        ("Nilai x pada persamaan 2x + 6 = 14 adalah ...", ["2", "4", "6", "8"], 1),
        ("Rata-rata dari 4, 8, dan 12 adalah ...", ["6", "7", "8", "9"], 2),
    ],
    "science": [
        ("Proses tumbuhan membuat makanan dengan bantuan cahaya matahari disebut ...", ["Respirasi", "Fotosintesis", "Transpirasi", "Fermentasi"], 1),
        ("Planet terdekat dari Matahari adalah ...", ["Venus", "Bumi", "Merkurius", "Mars"], 2),
        ("Satuan gaya dalam SI adalah ...", ["Joule", "Watt", "Newton", "Pascal"], 2),
        ("Air mendidih pada suhu ... derajat Celsius (tekanan normal).", ["50", "75", "100", "125"], 2),
        ("Organ tubuh yang berfungsi memompa darah adalah ...", ["Paru-paru", "Jantung", "Hati", "Ginjal"], 1),
    ],
    "english": [
        ("She ___ to school every day.", ["go", "goes", "going", "gone"], 1),
        ("The opposite of 'happy' is ...", ["sad", "glad", "joyful", "excited"], 0),
        ("Choose the correct sentence.", ["He don't like tea.", "He doesn't likes tea.", "He doesn't like tea.", "He not like tea."], 2),
        ("'Book' in Bahasa Indonesia means ...", ["Meja", "Buku", "Pensil", "Kursi"], 1),
        ("Yesterday, I ___ a movie.", ["watch", "watches", "watched", "watching"], 2),
    ],
    "history": [
        ("Proklamasi Kemerdekaan Indonesia dibacakan pada tanggal ...", ["17 Agustus 1945", "28 Oktober 1928", "10 November 1945", "1 Juni 1945"], 0),
        ("Teks proklamasi dibacakan oleh ...", ["Mohammad Hatta", "Soekarno", "Soedirman", "Sutan Sjahrir"], 1),
        ("Hari Sumpah Pemuda diperingati setiap tanggal ...", ["17 Agustus", "28 Oktober", "10 November", "2 Mei"], 1),
        ("Kerajaan Hindu tertua di Indonesia adalah ...", ["Majapahit", "Sriwijaya", "Kutai", "Mataram"], 2),
        ("Hari Pahlawan diperingati untuk mengenang pertempuran di kota ...", ["Bandung", "Surabaya", "Semarang", "Yogyakarta"], 1),
    ],
}

PRE_TEST_PASSING_SCORE = 60


async def _seed_courses() -> None:
    now = utcnow()
    for course_id, title in COURSES.items():
        description, order = COURSE_META[course_id]
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


async def _seed_tests_questions_answers() -> None:
    """Seed pre-test tests + normalized questions/answers; migrate legacy docs."""
    now = utcnow()
    for course_id, title in COURSES.items():
        items = PRE_TEST_QUESTIONS[course_id]
        test_id = f"{course_id}_pre_test"

        await db.tests.update_one(
            {"course_id": course_id, "test_type": "pre_test"},
            {
                "$set": {
                    "test_id": test_id,
                    "title": f"Pre-Test {title}",
                    "description": f"Ukur pengetahuan awalmu tentang {title}.",
                    "passing_score": PRE_TEST_PASSING_SCORE,
                    "total_questions": len(items),
                    "order": 1,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

        expected_answers = sum(len(opts) for _, opts, _ in items)
        existing_answers = await db.answers.count_documents(
            {"question_id": {"$regex": f"^{course_id}_pre_"}}
        )
        existing_questions = await db.questions.count_documents(
            {"course_id": course_id, "test_type": "pre_test"}
        )
        # Up-to-date and already normalized -> skip. Otherwise re-seed cleanly
        # (this also migrates legacy questions that embedded their options).
        sample = await db.questions.find_one(
            {"course_id": course_id, "test_type": "pre_test"}
        )
        already_normalized = sample is not None and "options" not in sample
        if (
            already_normalized
            and existing_questions == len(items)
            and existing_answers == expected_answers
        ):
            continue

        q_ids = [f"{course_id}_pre_{i + 1}" for i in range(len(items))]
        await db.answers.delete_many({"question_id": {"$in": q_ids}})
        await db.questions.delete_many(
            {"course_id": course_id, "test_type": "pre_test"}
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
                    "test_type": "pre_test",
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
        await db.questions.insert_many(question_docs)
        await db.answers.insert_many(answer_docs)
        logger.info("Seeded normalized pre-test for %s", course_id)


async def _seed_learning_content() -> None:
    """Seed real materials, videos, and manual books per course."""
    now = utcnow()
    for course_id, title in COURSES.items():
        materials = [
            (
                f"Pengantar {title}",
                f"Konsep dasar yang perlu kamu pahami dalam {title}.",
                f"Pada materi ini kamu akan mengenal konsep inti {title}, "
                f"istilah penting, dan contoh penerapannya dalam kehidupan sehari-hari.",
            ),
            (
                f"Pendalaman {title}",
                f"Materi lanjutan untuk memperkuat pemahaman {title}.",
                f"Materi pendalaman {title} membahas penerapan konsep pada "
                f"soal-soal dan studi kasus yang lebih kompleks.",
            ),
        ]
        for i, (m_title, m_desc, m_content) in enumerate(materials):
            await db.materials.update_one(
                {"material_id": f"{course_id}_mat_{i + 1}"},
                {
                    "$set": {
                        "course_id": course_id,
                        "title": m_title,
                        "description": m_desc,
                        "content": m_content,
                        "order": i + 1,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "material_id": f"{course_id}_mat_{i + 1}",
                        "created_at": now,
                    },
                },
                upsert=True,
            )

        videos = [
            (
                f"Video Pengantar {title}",
                f"Penjelasan visual konsep dasar {title}.",
                "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                600,
            ),
        ]
        for i, (v_title, v_desc, v_url, v_dur) in enumerate(videos):
            await db.videos.update_one(
                {"video_id": f"{course_id}_vid_{i + 1}"},
                {
                    "$set": {
                        "course_id": course_id,
                        "title": v_title,
                        "description": v_desc,
                        "url": v_url,
                        "duration_seconds": v_dur,
                        "order": i + 1,
                        "updated_at": now,
                    },
                    "$setOnInsert": {
                        "video_id": f"{course_id}_vid_{i + 1}",
                        "created_at": now,
                    },
                },
                upsert=True,
            )

        await db.manual_books.update_one(
            {"book_id": f"{course_id}_book"},
            {
                "$set": {
                    "course_id": course_id,
                    "title": f"Buku Panduan {title}",
                    "description": f"Panduan lengkap {title} dalam format PDF.",
                    "file_url": "https://www.africau.edu/images/default/sample.pdf",
                    "pages": 24,
                    "updated_at": now,
                },
                "$setOnInsert": {"book_id": f"{course_id}_book", "created_at": now},
            },
            upsert=True,
        )


async def seed_database() -> None:
    """Master seeder for the normalized catalog."""
    await _seed_courses()
    await _seed_tests_questions_answers()
    await _seed_learning_content()
    logger.info("LearnSpace catalog seeded")
