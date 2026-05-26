"""Cooldown compartido entre visión y eventos de navegador."""

from __future__ import annotations

import time
from dataclasses import dataclass

from app.config import get_settings
from app.models.violation import ViolationType

settings = get_settings()


@dataclass
class _CooldownEntry:
    monotonic_at: float
    confidence: float


_cooldown_state: dict[tuple[str, str], _CooldownEntry] = {}


def reset_cooldown_state(session_id: str | None = None) -> None:
    if session_id is None:
        _cooldown_state.clear()
        return
    keys = [k for k in _cooldown_state if k[0] == session_id]
    for k in keys:
        del _cooldown_state[k]


def cooldown_allows(session_id: str, violation_type: ViolationType, confidence: float) -> bool:
    key = (session_id, violation_type.value)
    entry = _cooldown_state.get(key)
    if entry is None:
        return True
    elapsed = time.monotonic() - entry.monotonic_at
    if elapsed >= settings.VIOLATION_COOLDOWN_SECONDS:
        return True
    return confidence >= entry.confidence + settings.VIOLATION_COOLDOWN_CONFIDENCE_BUMP


def mark_cooldown(session_id: str, violation_type: ViolationType, confidence: float) -> None:
    _cooldown_state[(session_id, violation_type.value)] = _CooldownEntry(
        monotonic_at=time.monotonic(),
        confidence=confidence,
    )
