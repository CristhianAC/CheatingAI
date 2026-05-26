"""Mensajes legibles para estudiantes y respuestas API (sin datos técnicos)."""

from __future__ import annotations

from app.models.violation import ViolationType

_STUDENT_LABELS: dict[ViolationType, str] = {
    ViolationType.LOOKING_AWAY: "Mirada desviada de la pantalla",
    ViolationType.NO_PERSON: "Rostro no visible en cámara",
    ViolationType.MULTIPLE_PERSONS: "Más de una persona en cámara",
    ViolationType.PHONE_DETECTED: "Posible uso de teléfono",
    ViolationType.TAB_SWITCH: "Cambio de pestaña del navegador",
    ViolationType.WINDOW_BLUR: "Cambio a otra ventana o aplicación",
    ViolationType.IDENTITY_MISMATCH: "Verificación de identidad",
}

_STUDENT_HINTS: dict[ViolationType, str] = {
    ViolationType.LOOKING_AWAY: "Mira de nuevo hacia la pantalla del examen.",
    ViolationType.NO_PERSON: "Colócate frente a la cámara con buena iluminación.",
    ViolationType.MULTIPLE_PERSONS: "Debes estar solo durante la prueba.",
    ViolationType.PHONE_DETECTED: "Guarda el teléfono y mantén las manos visibles.",
    ViolationType.TAB_SWITCH: "Permanece en la pestaña del examen.",
    ViolationType.WINDOW_BLUR: "Vuelve a la ventana del examen.",
    ViolationType.IDENTITY_MISMATCH: "Asegúrate de ser tú quien realiza el examen.",
}


def student_violation_description(violation_type: ViolationType) -> str:
    return _STUDENT_LABELS.get(violation_type, violation_type.value.replace("_", " "))


def student_violation_hint(violation_type: ViolationType) -> str:
    return _STUDENT_HINTS.get(violation_type, "Revisa tu postura y el entorno de la prueba.")
