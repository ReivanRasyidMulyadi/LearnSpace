"""MongoDB connection and index setup for the normalized LearnSpace schema."""
import logging
import os

from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]


async def ensure_indexes() -> None:
    """Create required indexes on startup. Enforces identity + relationships."""
    # --- Identity -----------------------------------------------------------
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)

    await db.profiles.create_index("profile_id", unique=True)
    await db.profiles.create_index("user_id", unique=True)

    # --- Sessions -----------------------------------------------------------
    session_indexes = await db.user_sessions.index_information()
    if "session_token_1" in session_indexes:
        await db.user_sessions.drop_index("session_token_1")
    await db.user_sessions.create_index("token_hash", unique=True, sparse=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)

    # --- Catalog ------------------------------------------------------------
    await db.courses.create_index("course_id", unique=True)
    await db.courses.create_index("slug", unique=True)
    await db.courses.create_index("order")

    await db.materials.create_index("material_id", unique=True)
    await db.materials.create_index([("course_id", 1), ("order", 1)])

    await db.videos.create_index("video_id", unique=True)
    await db.videos.create_index([("course_id", 1), ("order", 1)])

    await db.manual_books.create_index("book_id", unique=True)
    await db.manual_books.create_index("course_id")

    # --- Tests / questions / answers ---------------------------------------
    await db.tests.create_index("test_id", unique=True)
    await db.tests.create_index([("course_id", 1), ("test_type", 1)], unique=True)

    await db.questions.create_index("question_id", unique=True)
    await db.questions.create_index([("test_id", 1), ("order", 1)])
    await db.questions.create_index([("course_id", 1), ("test_type", 1), ("order", 1)])

    await db.answers.create_index("answer_id", unique=True)
    await db.answers.create_index([("question_id", 1), ("order", 1)])

    # --- Student progress & results ----------------------------------------
    await db.material_progress.create_index("progress_id", unique=True)
    await db.material_progress.create_index(
        [("user_id", 1), ("material_id", 1)], unique=True
    )
    await db.material_progress.create_index([("user_id", 1), ("course_id", 1)])

    await db.video_progress.create_index("progress_id", unique=True)
    await db.video_progress.create_index(
        [("user_id", 1), ("video_id", 1)], unique=True
    )
    await db.video_progress.create_index([("user_id", 1), ("course_id", 1)])

    await db.test_attempts.create_index("attempt_id", unique=True)
    await db.test_attempts.create_index([("user_id", 1), ("test_id", 1)])
    await db.test_attempts.create_index(
        [("user_id", 1), ("course_id", 1), ("test_type", 1)]
    )

    await db.test_results.create_index("result_id", unique=True)
    await db.test_results.create_index("attempt_id", unique=True)
    await db.test_results.create_index([("user_id", 1), ("test_id", 1)])
    await db.test_results.create_index(
        [("user_id", 1), ("course_id", 1), ("test_type", 1)]
    )

    await db.course_progress.create_index(
        [("user_id", 1), ("course_id", 1)], unique=True
    )

    # --- Discussion & notifications ----------------------------------------
    await db.discussions.create_index("discussion_id", unique=True)
    await db.discussions.create_index([("course_id", 1), ("created_at", -1)])
    await db.discussions.create_index("user_id")

    await db.comments.create_index("comment_id", unique=True)
    await db.comments.create_index([("discussion_id", 1), ("created_at", 1)])
    await db.comments.create_index("parent_comment_id")

    await db.notifications.create_index("notification_id", unique=True)
    await db.notifications.create_index(
        [("user_id", 1), ("read", 1), ("created_at", -1)]
    )

    logger.info("MongoDB indexes ready")
