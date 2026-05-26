"""Unit tests para exam_access (activo vs pendiente)."""

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

from app.services.exam_access import derive_exam_ui_status, is_exam_joinable


def _exam(**kwargs):
    return SimpleNamespace(**kwargs)


def test_pending_when_scheduled_in_future():
    now = datetime(2026, 5, 26, 12, 0, tzinfo=timezone.utc)
    exam = _exam(
        status="scheduled",
        scheduled_at=now + timedelta(hours=1),
        duration_minutes=60,
        ends_at=None,
    )
    assert derive_exam_ui_status(exam, now) == "pendiente"
    joinable, ui = is_exam_joinable(exam, now)
    assert not joinable
    assert ui == "pendiente"


def test_active_when_status_active():
    now = datetime(2026, 5, 26, 12, 0, tzinfo=timezone.utc)
    exam = _exam(
        status="active",
        scheduled_at=now - timedelta(hours=1),
        duration_minutes=120,
        ends_at=now + timedelta(hours=1),
    )
    joinable, ui = is_exam_joinable(exam, now)
    assert joinable
    assert ui == "activo"


def test_active_when_scheduled_at_passed_even_if_status_scheduled():
    now = datetime(2026, 5, 26, 12, 0, tzinfo=timezone.utc)
    exam = _exam(
        status="scheduled",
        scheduled_at=now - timedelta(minutes=10),
        duration_minutes=60,
        ends_at=None,
    )
    assert derive_exam_ui_status(exam, now) == "activo"
    assert is_exam_joinable(exam, now)[0]
