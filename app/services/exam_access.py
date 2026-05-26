"""Reglas de acceso estudiante a exámenes (alineadas con client/src/lib/exam-status.js)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal

ExamUiStatus = Literal["pendiente", "activo", "finalizado"]


def _tz_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def compute_ends_at(exam, now: datetime | None = None) -> datetime | None:
    """Calcula ends_at si la BD no lo tiene (misma lógica que exams router)."""
    ends_at = _tz_aware(getattr(exam, "ends_at", None))
    if ends_at is not None:
        return ends_at

    scheduled_at = _tz_aware(getattr(exam, "scheduled_at", None))
    duration_minutes = getattr(exam, "duration_minutes", None)
    if scheduled_at is None or duration_minutes is None:
        return None
    try:
        minutes_int = int(duration_minutes)
    except (TypeError, ValueError):
        return None
    if minutes_int <= 0:
        return None
    return scheduled_at + timedelta(minutes=minutes_int)


def derive_exam_ui_status(exam, now: datetime | None = None) -> ExamUiStatus:
    """Replica deriveExamUiStatus del cliente."""
    now = now or datetime.now(timezone.utc)
    status = (getattr(exam, "status", None) or "scheduled").lower()
    ends_at = compute_ends_at(exam, now)
    starts_at = _tz_aware(getattr(exam, "scheduled_at", None))

    if status == "finished":
        return "finalizado"
    if ends_at is not None and now >= ends_at:
        return "finalizado"

    if status == "active":
        return "activo"

    if (
        starts_at is not None
        and now >= starts_at
        and (ends_at is None or now < ends_at)
    ):
        return "activo"

    return "pendiente"


def is_exam_joinable(exam, now: datetime | None = None) -> tuple[bool, ExamUiStatus]:
    """
    El estudiante solo puede unirse si el examen está en estado visual 'activo'.
    """
    ui = derive_exam_ui_status(exam, now)
    return ui == "activo", ui
