"""Attendance and QR Code system for LearnSpace."""
from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from auth import get_current_user, require_role
from db import db
from db_models import gen_id, utcnow
from models import UserPublic

router = APIRouter(prefix="/attendance", tags=["attendance"])


class CreateSessionRequest(BaseModel):
    course_id: str = Field(min_length=1)
    meeting_number: int = Field(default=1, ge=1, le=32)
    title: Optional[str] = None
    valid_minutes: int = Field(default=60, ge=5, le=480)


class ScanQRRequest(BaseModel):
    qr_code: str = Field(min_length=1)


class AttendanceSessionResponse(BaseModel):
    session_id: str
    course_id: str
    meeting_number: int
    title: str
    qr_code: str
    created_at: str
    expires_at: str
    is_active: bool
    total_attended: int = 0


@router.post("/session", response_model=AttendanceSessionResponse)
async def create_or_activate_session(
    payload: CreateSessionRequest,
    current_user: UserPublic = Depends(require_role("ADMIN")),
):
    """(Guru/Dosen) Buka sesi presensi baru dan generate QR Code."""
    now = utcnow()
    expires_at = now + timedelta(minutes=payload.valid_minutes)

    # Check course exists
    course = await db.courses.find_one({"course_id": payload.course_id})
    course_title = course.get("title", payload.course_id) if course else payload.course_id
    meeting_title = payload.title or f"Pertemuan ke-{payload.meeting_number}: {course_title}"

    # Generate a unique secure QR token
    token = secrets.token_hex(4).upper()
    qr_code = f"PRESENSI-{payload.course_id.upper()}-M{payload.meeting_number}-{token}"
    session_id = f"att_sess_{secrets.token_hex(8)}"

    doc = {
        "session_id": session_id,
        "course_id": payload.course_id,
        "meeting_number": payload.meeting_number,
        "title": meeting_title,
        "qr_code": qr_code,
        "created_by": current_user.user_id,
        "created_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "is_active": True,
    }

    await db.attendance_sessions.insert_one(doc)

    return AttendanceSessionResponse(
        session_id=session_id,
        course_id=payload.course_id,
        meeting_number=payload.meeting_number,
        title=meeting_title,
        qr_code=qr_code,
        created_at=now.isoformat(),
        expires_at=expires_at.isoformat(),
        is_active=True,
        total_attended=0,
    )


@router.get("/session/active")
async def get_active_sessions(
    course_id: Optional[str] = None,
    current_user: UserPublic = Depends(get_current_user),
):
    """Mendapatkan sesi presensi yang sedang aktif."""
    filter_dict: dict = {"is_active": True}
    if course_id:
        filter_dict["course_id"] = course_id

    sessions = await db.attendance_sessions.find(filter_dict).sort("created_at", -1).to_list(10)
    now_iso = utcnow().isoformat()

    valid_sessions = []
    for s in sessions:
        if s.get("expires_at", "") > now_iso:
            count = await db.attendances.count_documents({"session_id": s["session_id"]})
            valid_sessions.append(
                {
                    "session_id": s["session_id"],
                    "course_id": s["course_id"],
                    "meeting_number": s["meeting_number"],
                    "title": s.get("title", ""),
                    "qr_code": s["qr_code"],
                    "created_at": s["created_at"],
                    "expires_at": s["expires_at"],
                    "is_active": True,
                    "total_attended": count,
                }
            )

    return {"sessions": valid_sessions}


@router.post("/scan")
async def scan_qr_attendance(
    payload: ScanQRRequest,
    current_user: UserPublic = Depends(require_role("STUDENT")),
):
    """(Siswa/Mahasiswa) Scan QR Code presensi yang diberikan oleh guru/dosen."""
    qr_cleaned = payload.qr_code.strip()
    session = await db.attendance_sessions.find_one({"qr_code": qr_cleaned, "is_active": True})

    if not session:
        raise HTTPException(
            status_code=400,
            detail="Kode QR presensi tidak valid atau belum diaktifkan oleh guru/dosen.",
        )

    # Check expiration
    now = utcnow()
    expires_str = session.get("expires_at", "")
    try:
        expires_dt = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        if expires_dt.tzinfo is None:
            expires_dt = expires_dt.replace(tzinfo=timezone.utc)
        if now > expires_dt:
            raise HTTPException(
                status_code=400,
                detail="Sesi presensi untuk kode QR ini sudah kedaluwarsa.",
            )
    except (ValueError, TypeError):
        pass

    # Check already attended
    existing = await db.attendances.find_one(
        {"session_id": session["session_id"], "student_id": current_user.user_id}
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Kamu sudah melakukan presensi pada sesi ini.",
        )

    attendance_id = f"att_{secrets.token_hex(8)}"
    record = {
        "attendance_id": attendance_id,
        "session_id": session["session_id"],
        "student_id": current_user.user_id,
        "student_name": current_user.name,
        "course_id": session["course_id"],
        "meeting_number": session["meeting_number"],
        "scanned_at": now.isoformat(),
        "status": "HADIR",
    }
    await db.attendances.insert_one(record)

    return {
        "ok": True,
        "message": "Presensi berhasil dicatat!",
        "course_id": session["course_id"],
        "meeting_number": session["meeting_number"],
        "student_name": current_user.name,
        "scanned_at": record["scanned_at"],
    }


@router.get("/history")
async def get_student_attendance_history(
    course_id: Optional[str] = None,
    current_user: UserPublic = Depends(require_role("STUDENT")),
):
    """Mendapatkan riwayat presensi siswa saat ini."""
    filter_dict: dict = {"student_id": current_user.user_id}
    if course_id:
        filter_dict["course_id"] = course_id

    records = await db.attendances.find(filter_dict).sort("scanned_at", -1).to_list(50)
    return {"records": records, "total_hadir": len(records)}


@router.get("/records")
async def get_attendance_records_for_teacher(
    course_id: Optional[str] = None,
    session_id: Optional[str] = None,
    current_user: UserPublic = Depends(require_role("ADMIN")),
):
    """(Guru/Dosen) Rekap kehadiran siswa per mata pelajaran atau per sesi."""
    filter_dict: dict = {}
    if course_id:
        filter_dict["course_id"] = course_id
    if session_id:
        filter_dict["session_id"] = session_id

    records = await db.attendances.find(filter_dict).sort("scanned_at", -1).to_list(100)
    return {"records": records, "count": len(records)}
