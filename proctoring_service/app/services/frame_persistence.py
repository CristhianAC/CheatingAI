"""Persistencia de violaciones por captura periódica (identidad + ausencia consecutiva)."""

from __future__ import annotations

import logging

import numpy as np
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.violation import ViolationType
from app.services.identity_constants import ABSENT_FRAMES_THRESHOLD
from app.services.identity_profile_service import compare_frame_to_profile
from app.services.storage import upload_identity_violation_capture, upload_violation_evidence_capture
from app.services.vision.detector import AnalysisResult, ViolationDetected
from app.services import violation_dedup
from app.services.violation_dedup import cooldown_allows, mark_cooldown
from app.services.violation_service import ViolationService

logger = logging.getLogger(__name__)
settings = get_settings()

# session_id -> frames consecutivos sin rostro
_absent_frame_streaks: dict[str, int] = {}
# session_id -> consecutive frames with looking_away detected (before persist gate)
_gaze_away_streaks: dict[str, int] = {}


def reset_absent_streak(session_id: str) -> None:
    _absent_frame_streaks.pop(session_id, None)
    _gaze_away_streaks.pop(session_id, None)


def reset_cooldown_state(session_id: str | None = None) -> None:
    """Limpia cooldown y rachas de frame (útil en tests)."""
    violation_dedup.reset_cooldown_state(session_id)
    if session_id is None:
        _gaze_away_streaks.clear()
        _absent_frame_streaks.clear()
    else:
        _gaze_away_streaks.pop(session_id, None)
        _absent_frame_streaks.pop(session_id, None)


def _persist_min_confidence(violation_type: ViolationType) -> float:
    if violation_type == ViolationType.LOOKING_AWAY:
        return settings.LOOKING_AWAY_PERSIST_MIN_CONFIDENCE
    return settings.VIOLATION_PERSIST_MIN_CONFIDENCE


def _should_attach_snapshot(violation_type: ViolationType, confidence: float) -> bool:
    if violation_type == ViolationType.NO_PERSON:
        return False
    if violation_type == ViolationType.IDENTITY_MISMATCH:
        return True
    return confidence >= settings.VIOLATION_SNAPSHOT_MIN_CONFIDENCE


def _upload_snapshot(
    session_id: str,
    violation_type: ViolationType,
    frame_bytes: bytes,
) -> str | None:
    if violation_type == ViolationType.IDENTITY_MISMATCH:
        return upload_identity_violation_capture(session_id, frame_bytes)
    return upload_violation_evidence_capture(
        session_id, violation_type.client_key, frame_bytes
    )


def _persist_vision_violation(
    violation_svc: ViolationService,
    session_id: str,
    frame_bytes: bytes,
    detected: ViolationDetected,
) -> ViolationDetected | None:
    vtype = detected.violation_type
    confidence = detected.confidence

    if confidence < _persist_min_confidence(vtype):
        logger.debug(
            "Skipping %s (confidence %.2f < persist min %.2f)",
            vtype.value,
            confidence,
            _persist_min_confidence(vtype),
        )
        return None

    if not cooldown_allows(session_id, vtype, confidence):
        return None

    snapshot_url: str | None = None
    if _should_attach_snapshot(vtype, confidence):
        snapshot_url = _upload_snapshot(session_id, vtype, frame_bytes)

    violation_svc.record(
        session_id=session_id,
        violation_type=vtype,
        confidence=confidence,
        frame_snapshot=snapshot_url,
    )
    mark_cooldown(session_id, vtype, confidence)
    return detected


def _apply_gaze_consecutive_gate(session_id: str, violations: list[ViolationDetected]) -> list[ViolationDetected]:
    """Persist looking_away only after K consecutive detections in analyzed frames."""
    has_gaze = any(v.violation_type == ViolationType.LOOKING_AWAY for v in violations)
    if has_gaze:
        _gaze_away_streaks[session_id] = _gaze_away_streaks.get(session_id, 0) + 1
    else:
        _gaze_away_streaks[session_id] = 0

    required = settings.GAZE_CONSECUTIVE_FRAMES_REQUIRED
    streak = _gaze_away_streaks.get(session_id, 0)
    out: list[ViolationDetected] = []
    for v in violations:
        if v.violation_type == ViolationType.LOOKING_AWAY:
            if streak >= required:
                out.append(v)
        else:
            out.append(v)
    return out


def record_browser_violation(
    db: Session,
    session_id: str,
    violation_type: ViolationType,
    confidence: float = 1.0,
) -> bool:
    """Registra evento de navegador si pasa cooldown. Devuelve True si se guardó."""
    if not cooldown_allows(session_id, violation_type, confidence):
        return False
    ViolationService(db).record(
        session_id=session_id,
        violation_type=violation_type,
        confidence=confidence,
        frame_snapshot=None,
    )
    mark_cooldown(session_id, violation_type, confidence)
    return True


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
    Devuelve solo violaciones guardadas en BD (fuente de verdad para el cliente).
    """
    violation_svc = ViolationService(db)
    response_violations: list[ViolationDetected] = []

    if result.person_count == 0:
        streak = _absent_frame_streaks.get(session_id, 0) + 1
        _absent_frame_streaks[session_id] = streak
        _gaze_away_streaks[session_id] = 0
        if streak == ABSENT_FRAMES_THRESHOLD:
            no_person = ViolationDetected(
                violation_type=ViolationType.NO_PERSON,
                confidence=0.95,
                description="Sin rostro detectado en capturas consecutivas",
            )
            persisted = _persist_vision_violation(
                violation_svc, session_id, frame_bytes, no_person
            )
            if persisted is not None:
                response_violations.append(persisted)
        return response_violations

    _absent_frame_streaks[session_id] = 0

    if result.person_count == 1:
        identity_violation, _similarity = compare_frame_to_profile(db, student_id, frame_bgr)
        if identity_violation is not None:
            persisted = _persist_vision_violation(
                violation_svc, session_id, frame_bytes, identity_violation
            )
            if persisted is not None:
                response_violations.append(persisted)

    vision_list = _apply_gaze_consecutive_gate(session_id, _other_vision_violations(result))
    for v in vision_list:
        persisted = _persist_vision_violation(violation_svc, session_id, frame_bytes, v)
        if persisted is not None:
            response_violations.append(persisted)

    return response_violations


def _other_vision_violations(result: AnalysisResult) -> list[ViolationDetected]:
    return [
        v
        for v in result.violations
        if v.violation_type != ViolationType.NO_PERSON
        and v.violation_type != ViolationType.IDENTITY_MISMATCH
    ]
