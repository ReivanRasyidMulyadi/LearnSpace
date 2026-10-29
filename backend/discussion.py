"""Per-course discussion forum: threads + threaded comments.

Uses the normalized `discussions` and `comments` collections. Author identity
is never duplicated into these collections; it is joined from `users` at read
time. Any authenticated user (STUDENT or ADMIN) can participate.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from auth import get_current_user
from courses import get_course
from db import db
from db_models import gen_id, utcnow
from models import (
    CreateCommentRequest,
    CreateDiscussionRequest,
    UpdateCommentRequest,
    UpdateDiscussionRequest,
    UserPublic,
)

router = APIRouter(tags=["discussion"])


async def _require_course(course_id: str) -> None:
    if not await get_course(course_id):
        raise HTTPException(status_code=404, detail="course_not_found")


async def _authors(user_ids: set[str]) -> dict[str, dict]:
    if not user_ids:
        return {}
    docs = await db.users.find(
        {"user_id": {"$in": list(user_ids)}},
        {"_id": 0, "user_id": 1, "name": 1, "role": 1, "picture": 1},
    ).to_list(length=1000)
    return {d["user_id"]: d for d in docs}


def _author(authors: dict[str, dict], user_id: str) -> dict:
    doc = authors.get(user_id)
    if not doc:
        return {"user_id": user_id, "name": "Pengguna", "role": "STUDENT", "picture": None}
    return {
        "user_id": doc["user_id"],
        "name": doc.get("name", "Pengguna"),
        "role": doc.get("role", "STUDENT"),
        "picture": doc.get("picture"),
    }


def _discussion_public(doc: dict, authors: dict[str, dict]) -> dict:
    return {
        "discussion_id": doc["discussion_id"],
        "course_id": doc["course_id"],
        "title": doc["title"],
        "body": doc["body"],
        "comment_count": doc.get("comment_count", 0),
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "author": _author(authors, doc["user_id"]),
    }


def _comment_public(doc: dict, authors: dict[str, dict]) -> dict:
    return {
        "comment_id": doc["comment_id"],
        "discussion_id": doc["discussion_id"],
        "parent_comment_id": doc.get("parent_comment_id"),
        "body": doc["body"],
        "created_at": doc["created_at"],
        "updated_at": doc["updated_at"],
        "author": _author(authors, doc["user_id"]),
    }


@router.get("/courses/{course_id}/discussions")
async def list_discussions(
    course_id: str, user: UserPublic = Depends(get_current_user)
):
    await _require_course(course_id)
    docs = await (
        db.discussions.find({"course_id": course_id}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(length=500)
    )
    authors = await _authors({d["user_id"] for d in docs})
    return {"discussions": [_discussion_public(d, authors) for d in docs]}


@router.post("/courses/{course_id}/discussions", status_code=201)
async def create_discussion(
    course_id: str,
    payload: CreateDiscussionRequest,
    user: UserPublic = Depends(get_current_user),
):
    await _require_course(course_id)
    now = utcnow()
    doc = {
        "discussion_id": gen_id("disc"),
        "course_id": course_id,
        "user_id": user.user_id,
        "title": payload.title,
        "body": payload.body,
        "comment_count": 0,
        "created_at": now,
        "updated_at": now,
    }
    await db.discussions.insert_one(dict(doc))
    authors = await _authors({user.user_id})
    return _discussion_public(doc, authors)


@router.get("/discussions/{discussion_id}")
async def get_discussion(
    discussion_id: str, user: UserPublic = Depends(get_current_user)
):
    doc = await db.discussions.find_one({"discussion_id": discussion_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="discussion_not_found")
    comments = await (
        db.comments.find({"discussion_id": discussion_id}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(length=1000)
    )
    author_ids = {doc["user_id"]} | {c["user_id"] for c in comments}
    authors = await _authors(author_ids)
    return {
        "discussion": _discussion_public(doc, authors),
        "comments": [_comment_public(c, authors) for c in comments],
    }


@router.post("/discussions/{discussion_id}/comments", status_code=201)
async def create_comment(
    discussion_id: str,
    payload: CreateCommentRequest,
    user: UserPublic = Depends(get_current_user),
):
    discussion = await db.discussions.find_one(
        {"discussion_id": discussion_id}, {"_id": 0, "discussion_id": 1}
    )
    if not discussion:
        raise HTTPException(status_code=404, detail="discussion_not_found")

    if payload.parent_comment_id:
        parent = await db.comments.find_one(
            {
                "comment_id": payload.parent_comment_id,
                "discussion_id": discussion_id,
            },
            {"_id": 0, "comment_id": 1},
        )
        if not parent:
            raise HTTPException(status_code=404, detail="parent_comment_not_found")

    now = utcnow()
    doc = {
        "comment_id": gen_id("cmt"),
        "discussion_id": discussion_id,
        "user_id": user.user_id,
        "parent_comment_id": payload.parent_comment_id,
        "body": payload.body,
        "created_at": now,
        "updated_at": now,
    }
    await db.comments.insert_one(dict(doc))
    await db.discussions.update_one(
        {"discussion_id": discussion_id},
        {"$inc": {"comment_count": 1}, "$set": {"updated_at": now}},
    )
    authors = await _authors({user.user_id})
    return _comment_public(doc, authors)


@router.patch("/discussions/{discussion_id}")
async def update_discussion(
    discussion_id: str,
    payload: UpdateDiscussionRequest,
    user: UserPublic = Depends(get_current_user),
):
    doc = await db.discussions.find_one({"discussion_id": discussion_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="discussion_not_found")
    if doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="not_owner")

    now = utcnow()
    await db.discussions.update_one(
        {"discussion_id": discussion_id},
        {"$set": {"title": payload.title, "body": payload.body, "updated_at": now}},
    )
    doc.update({"title": payload.title, "body": payload.body, "updated_at": now})
    authors = await _authors({doc["user_id"]})
    return _discussion_public(doc, authors)


@router.delete("/discussions/{discussion_id}")
async def delete_discussion(
    discussion_id: str, user: UserPublic = Depends(get_current_user)
):
    doc = await db.discussions.find_one(
        {"discussion_id": discussion_id}, {"_id": 0, "user_id": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="discussion_not_found")
    if doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="not_owner")

    await db.comments.delete_many({"discussion_id": discussion_id})
    await db.discussions.delete_one({"discussion_id": discussion_id})
    return {"ok": True}


@router.patch("/comments/{comment_id}")
async def update_comment(
    comment_id: str,
    payload: UpdateCommentRequest,
    user: UserPublic = Depends(get_current_user),
):
    doc = await db.comments.find_one({"comment_id": comment_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="comment_not_found")
    if doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="not_owner")

    now = utcnow()
    await db.comments.update_one(
        {"comment_id": comment_id},
        {"$set": {"body": payload.body, "updated_at": now}},
    )
    doc.update({"body": payload.body, "updated_at": now})
    authors = await _authors({doc["user_id"]})
    return _comment_public(doc, authors)


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str, user: UserPublic = Depends(get_current_user)
):
    doc = await db.comments.find_one(
        {"comment_id": comment_id}, {"_id": 0, "user_id": 1, "discussion_id": 1}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="comment_not_found")
    if doc["user_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="not_owner")

    discussion_id = doc["discussion_id"]
    # Deleting a parent comment also removes its direct replies.
    await db.comments.delete_many(
        {
            "discussion_id": discussion_id,
            "$or": [
                {"comment_id": comment_id},
                {"parent_comment_id": comment_id},
            ],
        }
    )
    remaining = await db.comments.count_documents({"discussion_id": discussion_id})
    await db.discussions.update_one(
        {"discussion_id": discussion_id},
        {"$set": {"comment_count": remaining, "updated_at": utcnow()}},
    )
    return {"ok": True}
