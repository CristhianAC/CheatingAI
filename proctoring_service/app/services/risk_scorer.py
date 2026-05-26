"""
Risk scoring engine for proctoring session reports.

Translates raw violation events into a structured risk assessment that
professors can interpret without needing to understand the underlying
detection system.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional

from app.models.violation import ViolationEvent, ViolationType


# ---------------------------------------------------------------------------
# Risk levels
# ---------------------------------------------------------------------------


class RiskLevel(str, Enum):
    BAJO = "bajo"
    MEDIO = "medio"
    ALTO = "alto"
    CRITICO = "critico"


RISK_LEVEL_LABELS = {
    RiskLevel.BAJO: "Sin señales de trampa",
    RiskLevel.MEDIO: "Comportamiento inusual — revisión recomendada",
    RiskLevel.ALTO: "Comportamiento sospechoso — requiere atención",
    RiskLevel.CRITICO: "Alta probabilidad de trampa — intervención recomendada",
}

RISK_LEVEL_COLORS = {
    RiskLevel.BAJO: "green",
    RiskLevel.MEDIO: "yellow",
    RiskLevel.ALTO: "orange",
    RiskLevel.CRITICO: "red",
}


# ---------------------------------------------------------------------------
# Severity weights
# Each number represents the maximum points a single detection of that type
# can contribute to the raw score.  Critical types (identity, phone,
# multiple persons) are never diluted by exam duration.
# ---------------------------------------------------------------------------

VIOLATION_WEIGHTS: dict[ViolationType, float] = {
    ViolationType.IDENTITY_MISMATCH: 45,   # Someone else is taking the exam
    ViolationType.PHONE_DETECTED: 38,      # Using phone to look up answers
    ViolationType.MULTIPLE_PERSONS: 30,    # Someone present who could help
    ViolationType.TAB_SWITCH: 22,          # Likely consulting external resources
    ViolationType.NO_PERSON: 14,           # Student left the exam
    ViolationType.WINDOW_BLUR: 10,         # Application switch
    ViolationType.LOOKING_AWAY: 6,         # Gaze not on screen
}

# These violations are serious enough that a single occurrence elevates risk
# regardless of session duration.
CRITICAL_TYPES = {
    ViolationType.IDENTITY_MISMATCH,
    ViolationType.PHONE_DETECTED,
    ViolationType.MULTIPLE_PERSONS,
}

# These violations are rate-sensitive: occasional occurrences are less
# concerning than sustained patterns.
RATE_TYPES = {
    ViolationType.LOOKING_AWAY,
    ViolationType.TAB_SWITCH,
    ViolationType.WINDOW_BLUR,
    ViolationType.NO_PERSON,
}


# ---------------------------------------------------------------------------
# Data classes for the assessment output
# ---------------------------------------------------------------------------


@dataclass
class SuspiciousCluster:
    """A window of time where multiple violations fired in rapid succession."""
    window_start: datetime
    window_end: datetime
    violation_count: int
    violation_types: list[str]


@dataclass
class RiskAlert:
    severity: str          # "critico", "alto", "medio", "bajo"
    title: str             # Short noun phrase for the professor
    description: str       # Plain-language explanation of the concern
    evidence_count: int    # How many events triggered this alert
    first_at: Optional[datetime] = None
    last_at: Optional[datetime] = None


@dataclass
class RiskAssessment:
    score: int                              # 0-100
    level: RiskLevel
    level_label: str
    level_color: str
    summary: str                            # One sentence verdict for the professor
    alerts: list[RiskAlert] = field(default_factory=list)
    suspicious_clusters: list[SuspiciousCluster] = field(default_factory=list)
    # Breakdown helpers consumed by the frontend
    critical_findings: list[str] = field(default_factory=list)   # Top concerns
    behavioral_notes: list[str] = field(default_factory=list)    # Contextual observations


# ---------------------------------------------------------------------------
# Scorer
# ---------------------------------------------------------------------------


class RiskScorer:
    """
    Compute a risk assessment from a list of violation events.

    Usage:
        assessment = RiskScorer(violations, duration_seconds).compute()
    """

    # Diminishing returns: each additional event of the same type contributes
    # progressively less to the score.
    _DECAY = [1.0, 0.65, 0.40, 0.25]  # indices 0, 1, 2, 3+

    # Cluster detection: look for N violations within this time window.
    _CLUSTER_WINDOW = timedelta(seconds=90)
    _CLUSTER_MIN_VIOLATIONS = 3

    def __init__(self, violations: list[ViolationEvent], duration_seconds: float) -> None:
        self.violations = sorted(violations, key=lambda v: v.detected_at)
        self.duration_seconds = max(duration_seconds, 60)  # guard against zero
        self._by_type: dict[ViolationType, list[ViolationEvent]] = defaultdict(list)
        for v in self.violations:
            self._by_type[v.violation_type].append(v)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def compute(self) -> RiskAssessment:
        score = self._compute_score()
        level = self._score_to_level(score)
        clusters = self._detect_clusters()
        alerts = self._build_alerts(clusters)
        critical, behavioral = self._narrative_bullets(alerts)
        summary = self._summary_sentence(score, level, alerts)

        return RiskAssessment(
            score=score,
            level=level,
            level_label=RISK_LEVEL_LABELS[level],
            level_color=RISK_LEVEL_COLORS[level],
            summary=summary,
            alerts=sorted(alerts, key=lambda a: self._severity_order(a.severity)),
            suspicious_clusters=clusters,
            critical_findings=critical,
            behavioral_notes=behavioral,
        )

    # ------------------------------------------------------------------
    # Score computation
    # ------------------------------------------------------------------

    def _compute_score(self) -> int:
        critical_score = self._score_critical_violations()
        rate_score = self._score_rate_violations()
        cluster_bonus = self._cluster_bonus()

        raw = critical_score + rate_score + cluster_bonus

        # Special floor: identity mismatch + phone together is nearly certain fraud
        if (
            self._by_type[ViolationType.IDENTITY_MISMATCH]
            and self._by_type[ViolationType.PHONE_DETECTED]
        ):
            raw = max(raw, 88)

        return min(int(round(raw)), 100)

    def _score_critical_violations(self) -> float:
        """
        Critical violations are not normalized by duration.  A phone detection
        at minute 5 is just as serious as one at minute 55.
        """
        score = 0.0
        for vtype in CRITICAL_TYPES:
            events = self._by_type[vtype]
            if not events:
                continue
            for i, v in enumerate(events):
                decay = self._DECAY[min(i, len(self._DECAY) - 1)]
                score += VIOLATION_WEIGHTS[vtype] * v.confidence * decay
        return score

    def _score_rate_violations(self) -> float:
        """
        Rate violations are scored relative to exam duration so that a student
        who glanced away once in 90 minutes is not treated the same as one who
        looked away continuously throughout a 20-minute quiz.
        """
        # Baseline: 30 minutes.  Score doubles at 15 min, halves at 60 min.
        duration_factor = 1800 / self.duration_seconds  # >1 for short exams, <1 for long
        duration_factor = max(0.4, min(duration_factor, 2.0))  # clamp

        score = 0.0
        for vtype in RATE_TYPES:
            events = self._by_type[vtype]
            if not events:
                continue
            for i, v in enumerate(events):
                decay = self._DECAY[min(i, len(self._DECAY) - 1)]
                score += VIOLATION_WEIGHTS[vtype] * v.confidence * decay * duration_factor

        # Rate violations cap at 40 points so they don't overshadow critical ones
        return min(score, 40.0)

    def _cluster_bonus(self) -> float:
        """Each suspicious cluster of concurrent violations adds extra points."""
        clusters = self._detect_clusters()
        return min(len(clusters) * 6.0, 18.0)

    # ------------------------------------------------------------------
    # Pattern detection
    # ------------------------------------------------------------------

    def _detect_clusters(self) -> list[SuspiciousCluster]:
        """Find time windows where multiple different violation types fired."""
        if len(self.violations) < self._CLUSTER_MIN_VIOLATIONS:
            return []

        clusters: list[SuspiciousCluster] = []
        i = 0
        while i < len(self.violations):
            anchor = self.violations[i].detected_at
            window_end = anchor + self._CLUSTER_WINDOW
            window_events = [
                v for v in self.violations
                if anchor <= v.detected_at <= window_end
            ]
            if len(window_events) >= self._CLUSTER_MIN_VIOLATIONS:
                types = list({v.violation_type.client_key for v in window_events})
                clusters.append(SuspiciousCluster(
                    window_start=anchor,
                    window_end=window_events[-1].detected_at,
                    violation_count=len(window_events),
                    violation_types=types,
                ))
                # Skip past this cluster to avoid double-counting
                i += len(window_events)
            else:
                i += 1

        return clusters

    # ------------------------------------------------------------------
    # Alert generation
    # ------------------------------------------------------------------

    def _build_alerts(self, clusters: list[SuspiciousCluster]) -> list[RiskAlert]:
        alerts: list[RiskAlert] = []

        alerts.extend(self._alert_identity_mismatch())
        alerts.extend(self._alert_phone())
        alerts.extend(self._alert_multiple_persons())
        alerts.extend(self._alert_tab_switches())
        alerts.extend(self._alert_no_person())
        alerts.extend(self._alert_window_blur())
        alerts.extend(self._alert_looking_away())
        alerts.extend(self._alert_clusters(clusters))

        return alerts

    def _alert_identity_mismatch(self) -> list[RiskAlert]:
        events = self._by_type[ViolationType.IDENTITY_MISMATCH]
        if not events:
            return []
        avg_conf = sum(v.confidence for v in events) / len(events)
        conf_pct = int(avg_conf * 100)
        return [RiskAlert(
            severity="critico",
            title="Persona diferente al registrado",
            description=(
                f"El sistema detectó {len(events)} vez/veces que la persona "
                f"frente a la cámara no coincide con el estudiante registrado "
                f"(certeza promedio: {conf_pct}%). Esto puede indicar que otra "
                f"persona completó el examen en su lugar."
            ),
            evidence_count=len(events),
            first_at=events[0].detected_at,
            last_at=events[-1].detected_at,
        )]

    def _alert_phone(self) -> list[RiskAlert]:
        events = self._by_type[ViolationType.PHONE_DETECTED]
        if not events:
            return []
        max_conf = max(v.confidence for v in events)
        conf_pct = int(max_conf * 100)
        return [RiskAlert(
            severity="critico",
            title="Uso de teléfono móvil",
            description=(
                f"Se detectó un teléfono móvil en el encuadre {len(events)} vez/veces "
                f"(mayor certeza: {conf_pct}%). El uso de dispositivos durante el examen "
                f"es un indicador fuerte de consulta de respuestas externas."
            ),
            evidence_count=len(events),
            first_at=events[0].detected_at,
            last_at=events[-1].detected_at,
        )]

    def _alert_multiple_persons(self) -> list[RiskAlert]:
        events = self._by_type[ViolationType.MULTIPLE_PERSONS]
        if not events:
            return []
        return [RiskAlert(
            severity="alto",
            title="Varias personas en el encuadre",
            description=(
                f"En {len(events)} ocasiones se detectaron dos o más personas "
                f"frente a la cámara. La presencia de terceros durante el examen "
                f"sugiere asistencia no autorizada."
            ),
            evidence_count=len(events),
            first_at=events[0].detected_at,
            last_at=events[-1].detected_at,
        )]

    def _alert_tab_switches(self) -> list[RiskAlert]:
        events = self._by_type[ViolationType.TAB_SWITCH]
        if not events:
            return []
        duration_min = self.duration_seconds / 60
        rate = len(events) / max(duration_min, 1) * 10  # per 10 minutes

        if len(events) >= 5 or rate >= 2:
            severity = "alto"
            desc = (
                f"El estudiante cambió de pestaña o ventana {len(events)} veces "
                f"durante el examen (≈ {rate:.1f} por cada 10 minutos). "
                f"Este patrón frecuente sugiere consulta repetida de recursos externos."
            )
        else:
            severity = "medio"
            desc = (
                f"Se registraron {len(events)} cambio(s) de pestaña o ventana. "
                f"Pueden ser accidentales, pero requieren revisión si coinciden "
                f"con otras señales."
            )
        return [RiskAlert(
            severity=severity,
            title="Cambios de pestaña / ventana del navegador",
            description=desc,
            evidence_count=len(events),
            first_at=events[0].detected_at,
            last_at=events[-1].detected_at,
        )]

    def _alert_no_person(self) -> list[RiskAlert]:
        events = self._by_type[ViolationType.NO_PERSON]
        if not events:
            return []

        # Look for sustained absence: consecutive detections ~2s apart
        max_consecutive = self._max_consecutive_gap(events, gap_seconds=5)
        sustained_seconds = max_consecutive * 2  # ~2s between frames

        if sustained_seconds >= 30 or len(events) >= 8:
            severity = "alto"
            desc = (
                f"El estudiante no fue visible en la cámara {len(events)} veces. "
                f"La ausencia más larga estimada fue de ~{sustained_seconds} segundos. "
                f"Puede indicar que el estudiante abandonó el equipo o evitó la cámara."
            )
        else:
            severity = "medio"
            desc = (
                f"Se detectaron {len(events)} momento(s) en que el estudiante "
                f"no aparecía frente a la cámara. Pueden ser pausas breves, "
                f"pero deben considerarse en conjunto con otras señales."
            )
        return [RiskAlert(
            severity=severity,
            title="Estudiante ausente de la cámara",
            description=desc,
            evidence_count=len(events),
            first_at=events[0].detected_at,
            last_at=events[-1].detected_at,
        )]

    def _alert_window_blur(self) -> list[RiskAlert]:
        events = self._by_type[ViolationType.WINDOW_BLUR]
        if len(events) < 3:
            return []  # A couple of accidental clicks is normal; don't trivialize
        duration_min = self.duration_seconds / 60
        rate = len(events) / max(duration_min, 1) * 10
        return [RiskAlert(
            severity="medio",
            title="Pérdida de foco frecuente en la aplicación",
            description=(
                f"La ventana del examen perdió el foco {len(events)} veces "
                f"(≈ {rate:.1f} por 10 minutos). Puede indicar alternancia "
                f"entre el examen y otra aplicación, pero por sí solo no es concluyente."
            ),
            evidence_count=len(events),
            first_at=events[0].detected_at,
            last_at=events[-1].detected_at,
        )]

    def _alert_looking_away(self) -> list[RiskAlert]:
        events = self._by_type[ViolationType.LOOKING_AWAY]
        if not events:
            return []
        duration_min = self.duration_seconds / 60
        rate = len(events) / max(duration_min, 1) * 10  # per 10 min
        avg_conf = sum(v.confidence for v in events) / len(events)

        if rate >= 8 or (len(events) >= 15 and avg_conf >= 0.8):
            severity = "alto"
            desc = (
                f"El estudiante miró fuera de la pantalla {len(events)} veces "
                f"(≈ {rate:.1f} por cada 10 minutos, certeza promedio {int(avg_conf*100)}%). "
                f"Este patrón sostenido sugiere que el estudiante consultaba material "
                f"fuera del campo de la cámara."
            )
        elif rate >= 3 or len(events) >= 6:
            severity = "medio"
            desc = (
                f"Se detectaron {len(events)} desvíos de mirada durante el examen "
                f"(certeza promedio {int(avg_conf*100)}%). Tomados en conjunto con "
                f"otras señales, pueden indicar consulta de apuntes o notas."
            )
        else:
            # Low rate, don't generate alert to avoid trivializing
            return []

        return [RiskAlert(
            severity=severity,
            title="Mirada frecuentemente alejada de la pantalla",
            description=desc,
            evidence_count=len(events),
            first_at=events[0].detected_at,
            last_at=events[-1].detected_at,
        )]

    def _alert_clusters(self, clusters: list[SuspiciousCluster]) -> list[RiskAlert]:
        if not clusters:
            return []
        # Report the most significant cluster only to avoid redundancy
        biggest = max(clusters, key=lambda c: c.violation_count)
        types_str = ", ".join(
            self._violation_label(t) for t in biggest.violation_types
        )
        return [RiskAlert(
            severity="alto",
            title="Pico de comportamiento sospechoso",
            description=(
                f"Se identificaron {len(clusters)} momento(s) de concentración de "
                f"señales irregulares. El más intenso ocurrió a las "
                f"{biggest.window_start.strftime('%H:%M:%S')} con "
                f"{biggest.violation_count} eventos en menos de 90 segundos "
                f"({types_str}). Los picos simultáneos son más indicativos de "
                f"trampa que los eventos aislados."
            ),
            evidence_count=sum(c.violation_count for c in clusters),
            first_at=clusters[0].window_start,
            last_at=clusters[-1].window_end,
        )]

    # ------------------------------------------------------------------
    # Narrative helpers
    # ------------------------------------------------------------------

    def _narrative_bullets(
        self, alerts: list[RiskAlert]
    ) -> tuple[list[str], list[str]]:
        critical = [a.title for a in alerts if a.severity == "critico"]
        high = [a.title for a in alerts if a.severity == "alto"]
        medium = [a.title for a in alerts if a.severity == "medio"]
        behavioral = high + medium
        return critical, behavioral

    def _summary_sentence(
        self, score: int, level: RiskLevel, alerts: list[RiskAlert]
    ) -> str:
        n_alerts = len(alerts)
        critical_alerts = [a for a in alerts if a.severity == "critico"]
        high_alerts = [a for a in alerts if a.severity == "alto"]

        if level == RiskLevel.BAJO:
            return (
                "El estudiante completó el examen sin señales significativas de "
                "comportamiento irregular. No se requiere revisión adicional."
            )
        if level == RiskLevel.MEDIO:
            return (
                f"Se detectaron {n_alerts} irregularidad(es) de nivel moderado. "
                f"Se recomienda revisar el historial de eventos para confirmar "
                f"si el comportamiento fue accidental o intencional."
            )
        if level == RiskLevel.ALTO:
            titles = "; ".join(a.title for a in high_alerts[:2])
            return (
                f"El estudiante mostró {n_alerts} señal(es) de comportamiento "
                f"sospechoso, incluyendo: {titles}. "
                f"Se recomienda una revisión formal del caso."
            )
        # CRITICO
        titles = "; ".join(a.title for a in critical_alerts[:2])
        return (
            f"Existen indicadores críticos de trampa ({titles}). "
            f"La puntuación de riesgo es {score}/100. "
            f"Se recomienda intervención inmediata y verificación de identidad."
        )

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------

    @staticmethod
    def _score_to_level(score: int) -> RiskLevel:
        if score <= 22:
            return RiskLevel.BAJO
        if score <= 48:
            return RiskLevel.MEDIO
        if score <= 72:
            return RiskLevel.ALTO
        return RiskLevel.CRITICO

    @staticmethod
    def _severity_order(severity: str) -> int:
        return {"critico": 0, "alto": 1, "medio": 2, "bajo": 3}.get(severity, 4)

    @staticmethod
    def _max_consecutive_gap(events: list[ViolationEvent], gap_seconds: int) -> int:
        """Count the longest streak of events separated by ≤ gap_seconds."""
        if not events:
            return 0
        max_streak = current_streak = 1
        for i in range(1, len(events)):
            delta = (events[i].detected_at - events[i - 1].detected_at).total_seconds()
            if delta <= gap_seconds:
                current_streak += 1
                max_streak = max(max_streak, current_streak)
            else:
                current_streak = 1
        return max_streak

    @staticmethod
    def _violation_label(vtype_value: str) -> str:
        labels = {
            "identity_mismatch": "identidad diferente",
            "phone_detected": "teléfono",
            "multiple_persons": "varias personas",
            "tab_switch": "cambio de pestaña",
            "no_person": "ausencia",
            "window_blur": "pérdida de foco",
            "looking_away": "mirada desviada",
        }
        return labels.get(vtype_value, vtype_value)
