"""Pruebas unitarias del motor de riesgo (sin visión ni HTTP)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from app.models.violation import ViolationEvent, ViolationType
from app.services.risk_scorer import RiskLevel, RiskScorer


def _ev(
    vtype: ViolationType,
    minute: int = 0,
    confidence: float = 1.0,
    session_id: str = "sess-test",
) -> ViolationEvent:
    e = ViolationEvent(
        id=str(uuid.uuid4()),
        session_id=session_id,
        violation_type=vtype,
        confidence=confidence,
        frame_snapshot=None,
    )
    e.detected_at = datetime(2025, 6, 1, 10, minute, 0, tzinfo=timezone.utc)
    return e


def test_sin_violaciones_nivel_bajo() -> None:
    assessment = RiskScorer([], duration_seconds=3600).compute()
    assert assessment.level == RiskLevel.BAJO
    assert assessment.score < 20


def test_telefono_mas_desajuste_identidad_eleva_piso() -> None:
    """Combinación identity_mismatch + phone_detected fuerza raw >= 88 en el motor."""
    violations = [
        _ev(ViolationType.IDENTITY_MISMATCH, minute=0),
        _ev(ViolationType.PHONE_DETECTED, minute=1),
    ]
    assessment = RiskScorer(violations, duration_seconds=3600).compute()
    assert assessment.score >= 88
    assert assessment.level in (RiskLevel.ALTO, RiskLevel.CRITICO)


def test_multiples_tab_switch_contribuyen_al_score() -> None:
    violations = [_ev(ViolationType.TAB_SWITCH, minute=m) for m in range(5)]
    assessment = RiskScorer(violations, duration_seconds=1800).compute()
    assert assessment.score > 15
