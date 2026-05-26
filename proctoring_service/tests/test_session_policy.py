"""Política de una supervisión por examen y estudiante."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.session import ProctoringSession, SessionStatus
from app.schemas.session import SessionCreate
from app.services.session_service import SessionService


def _session(exam_id: str, student_id: str, status: SessionStatus, started_at: datetime) -> ProctoringSession:
    return ProctoringSession(
        id=str(uuid.uuid4()),
        exam_id=exam_id,
        student_id=student_id,
        status=status,
        started_at=started_at,
        ended_at=None,
    )


def test_resume_active_session_within_window():
    db = MagicMock()
    now = datetime.now(timezone.utc)
    active = _session("exam-1", "stu-1", SessionStatus.ACTIVE, now - timedelta(minutes=5))

    query = MagicMock()
    query.filter.return_value.order_by.return_value.first.side_effect = [active, None]
    db.query.return_value = query

    session, resumed = SessionService(db).create_or_resume(
        SessionCreate(exam_id="exam-1", student_id="stu-1")
    )

    assert resumed is True
    assert session.id == active.id


def test_rejects_when_already_completed():
    db = MagicMock()
    ended = _session("exam-1", "stu-1", SessionStatus.ENDED, datetime.now(timezone.utc))
    ended.ended_at = datetime.now(timezone.utc)

    query = MagicMock()
    query.filter.return_value.order_by.return_value.first.side_effect = [None, ended]
    db.query.return_value = query

    with pytest.raises(HTTPException) as exc:
        SessionService(db).create_or_resume(SessionCreate(exam_id="exam-1", student_id="stu-1"))

    assert exc.value.status_code == 409
    assert exc.value.detail["code"] == "SESSION_ALREADY_COMPLETED"
