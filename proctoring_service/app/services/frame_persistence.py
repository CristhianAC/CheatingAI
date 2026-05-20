"""Persistencia de violaciones por captura periódica (identidad + ausencia consecutiva)."""

from __future__ import annotations

import logging

import numpy as np
from sqlalchemy.orm import Session

from app.models.violation import ViolationType
from app.services.identity_constants import ABSENT_FRAMES_THRESHOLD
from app.services.identity_profile_service import compare_frame_to_profile
from app.services.storage import upload_identity_violation_capture
from app.services.vision.detector import AnalysisResult, ViolationDetected
from app.services.violation_service import ViolationService

logger = logging.getLogger(__name__)

# session_id -> frames consecutivos sin rostro
_absent_frame_streaks: dict[str, int] = {}


def reset_absent_streak(session_id: str) -> None:
    _absent_frame_streaks.pop(session_id, None)


def persist_frame_analysis(
    db: Session,
    session_id: str,
    student_id: str,
    frame_bytes: bytes,
    frame_bgr: np.ndarray,
    result: AnalysisResult,
) -> list[ViolationDetected]:
    """
    Aplica reglas de negocio y persiste violaciones.
    Devuelve la lista de violaciones a exponer en la respuesta API.
    """
    violation_svc = ViolationService(db)
    response_violations: list[ViolationDetected] = []

    # ── Ausencia: solo tras N frames consecutivos sin rostro ──
    if result.person_count == 0:
        streak = _absent_frame_streaks.get(session_id, 0) + 1
        _absent_frame_streaks[session_id] = streak
        if streak == ABSENT_FRAMES_THRESHOLD:
            no_person = ViolationDetected(
                violation_type=ViolationType.NO_PERSON,
                confidence=0.95,
                description=f"Sin rostro detectado en {ABSENT_FRAMES_THRESHOLD} capturas consecutivas",
            )
            violation_svc.record(
                session_id=session_id,
                violation_type=ViolationType.NO_PERSON,
                confidence=no_person.confidence,
                frame_snapshot=None,
            )
            response_violations.append(no_person)
        return response_violations + _other_vision_violations(result)

    _absent_frame_streaks[session_id] = 0

    # ── Identidad vs foto de perfil (solo con un rostro) ──
    if result.person_count == 1:
        identity_violation, _similarity = compare_frame_to_profile(db, student_id, frame_bgr)
        if identity_violation is not None:
            capture_url = upload_identity_violation_capture(session_id, frame_bytes)
            violation_svc.record(
                session_id=session_id,
                violation_type=ViolationType.IDENTITY_MISMATCH,
                confidence=identity_violation.confidence,
                frame_snapshot=capture_url,
            )
            response_violations.append(identity_violation)

    # ── Otras violaciones de visión (sin guardar imagen) ──
    for v in _other_vision_violations(result):
        violation_svc.record(
            session_id=session_id,
            violation_type=v.violation_type,
            confidence=v.confidence,
            frame_snapshot=None,
        )
        response_violations.append(v)

    return response_violations


def _other_vision_violations(result: AnalysisResult) -> list[ViolationDetected]:
    return [
        v
        for v in result.violations
        if v.violation_type != ViolationType.NO_PERSON
    ]
