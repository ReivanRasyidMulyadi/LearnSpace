"""Document (persistence) models for the normalized LearnSpace schema.

Design rules:
- User identity (email / name / role) lives ONLY in `users`. Every other
  collection references the user by `user_id` and never copies identity fields.
- Every student-owned record carries `user_id`.
- Every document has `created_at` / `updated_at` (UTC).
- Progress-style records additionally carry `started_at` / `completed_at`.
- Relationships are modelled by stable string foreign keys (course_id,
  material_id, video_id, test_id, question_id, discussion_id, ...).

These models document the schema and are used by the seeders and endpoints to
build / validate documents consistently.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

TestType = Literal["pre_test", "post_test"]
ProgressStatus = Literal["not_started", "in_progress", "completed"]
AttemptStatus = Literal["in_progress", "submitted"]


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class Profile(BaseModel):
    """1:1 extension of a user. Does NOT duplicate email/name/role."""

    profile_id: str
    user_id: str
    bio: Optional[str] = None
    phone: Optional[str] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    avatar_url: Optional[str] = None
    date_of_birth: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Course(BaseModel):
    course_id: str
    slug: str
    title: str
    description: str
    order: int
    created_at: datetime
    updated_at: datetime


class Material(BaseModel):
    material_id: str
    course_id: str
    title: str
    description: str
    content: str
    order: int
    created_at: datetime
    updated_at: datetime


class MaterialProgress(BaseModel):
    progress_id: str
    user_id: str
    material_id: str
    course_id: str
    status: ProgressStatus = "not_started"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class Video(BaseModel):
    video_id: str
    course_id: str
    title: str
    description: str
    url: str
    duration_seconds: int
    order: int
    created_at: datetime
    updated_at: datetime


class VideoProgress(BaseModel):
    progress_id: str
    user_id: str
    video_id: str
    course_id: str
    watched_seconds: int = 0
    status: ProgressStatus = "not_started"
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ManualBook(BaseModel):
    book_id: str
    course_id: str
    title: str
    description: str
    file_url: str
    pages: int
    created_at: datetime
    updated_at: datetime


class Test(BaseModel):
    test_id: str
    course_id: str
    test_type: TestType
    title: str
    description: str
    passing_score: int  # percentage threshold to "pass"
    total_questions: int
    order: int
    created_at: datetime
    updated_at: datetime


class Question(BaseModel):
    question_id: str
    test_id: str
    course_id: str
    test_type: TestType
    order: int
    text: str
    created_at: datetime
    updated_at: datetime


class Answer(BaseModel):
    """Normalized option for a question (replaces embedded option arrays)."""

    answer_id: str
    question_id: str
    order: int
    text: str
    is_correct: bool
    created_at: datetime
    updated_at: datetime


class TestAttempt(BaseModel):
    """A student's attempt session for a test."""

    attempt_id: str
    user_id: str
    test_id: str
    course_id: str
    test_type: TestType
    status: AttemptStatus = "in_progress"
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TestResult(BaseModel):
    """The scored outcome of a submitted attempt."""

    result_id: str
    attempt_id: str
    user_id: str
    test_id: str
    course_id: str
    test_type: TestType
    answers: dict[str, int]  # question_id -> selected option index
    score: int
    total: int
    percentage: int
    passed: bool
    review: list[dict]
    completed_at: datetime
    created_at: datetime
    updated_at: datetime


class Discussion(BaseModel):
    discussion_id: str
    course_id: str
    user_id: str  # author
    title: str
    body: str
    comment_count: int = 0
    created_at: datetime
    updated_at: datetime


class Comment(BaseModel):
    comment_id: str
    discussion_id: str
    user_id: str  # author
    parent_comment_id: Optional[str] = None
    body: str
    created_at: datetime
    updated_at: datetime


class Notification(BaseModel):
    notification_id: str
    user_id: str
    type: str
    title: str
    body: str
    data: dict = Field(default_factory=dict)
    read: bool = False
    created_at: datetime
    updated_at: datetime
