"""Pydantic models for API I/O.

MongoDB _id is NEVER returned to the client. Queries use projection {_id: 0}.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

Role = Literal["STUDENT", "ADMIN"]


class UserPublic(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    role: Role
    picture: Optional[str] = None
    auth_provider: Literal["password", "google"] = "password"
    created_at: datetime


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2, max_length=80)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password_too_long")
        if not any(char.isalpha() for char in value) or not any(
            char.isdigit() for char in value
        ):
            raise ValueError("password_requires_letter_and_number")
        return value

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("name_too_short")
        return normalized


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("password")
    @classmethod
    def validate_password_size(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("password_too_long")
        return value


class GoogleSessionRequest(BaseModel):
    session_id: str


class AuthResponse(BaseModel):
    session_token: str
    user: UserPublic


class SubmitTestRequest(BaseModel):
    """question_id -> selected option index. Unanswered questions are omitted."""

    answers: dict[str, int] = Field(default_factory=dict)


class CreateDiscussionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=140)
    body: str = Field(min_length=1, max_length=4000)

    @field_validator("title", "body")
    @classmethod
    def strip_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("empty_text")
        return normalized


class CreateCommentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(min_length=1, max_length=4000)
    parent_comment_id: Optional[str] = None

    @field_validator("body")
    @classmethod
    def strip_body(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("empty_text")
        return normalized


class UpdateDiscussionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=140)
    body: str = Field(min_length=1, max_length=4000)

    @field_validator("title", "body")
    @classmethod
    def strip_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("empty_text")
        return normalized


class UpdateCommentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    body: str = Field(min_length=1, max_length=4000)

    @field_validator("body")
    @classmethod
    def strip_body(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("empty_text")
        return normalized
