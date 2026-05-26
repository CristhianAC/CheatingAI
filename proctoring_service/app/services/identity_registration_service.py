"""Registro de identidad al inicio: MediaPipe para contar/recortar, DeepFace solo para embedding."""

from __future__ import annotations

import logging
from typing import Literal, Optional

import cv2
import numpy as np

from app.services.vision.face_detector import FaceDetector
from app.services.vision.identity_verifier import IdentityVerifier

logger = logging.getLogger(__name__)

ReasonCode = Literal["ok", "no_face", "multiple_faces", "model_error"]

_FACE_CROP_MARGIN = 0.15


def _crop_face_bgr(frame_bgr: np.ndarray, bbox: tuple[float, float, float, float]) -> np.ndarray:
    h, w = frame_bgr.shape[:2]
    xmin, ymin, bw, bh = bbox
    x1 = max(0, int((xmin - _FACE_CROP_MARGIN * bw) * w))
    y1 = max(0, int((ymin - _FACE_CROP_MARGIN * bh) * h))
    x2 = min(w, int((xmin + bw + _FACE_CROP_MARGIN * bw) * w))
    y2 = min(h, int((ymin + bh + _FACE_CROP_MARGIN * bh) * h))
    if x2 <= x1 or y2 <= y1:
        return frame_bgr
    return frame_bgr[y1:y2, x1:x2]


def register_identity_from_frame(
    frame_bgr: np.ndarray,
    face_detector: FaceDetector,
    identity_verifier: IdentityVerifier,
) -> tuple[bool, str, ReasonCode, Optional[int], Optional[list[float]]]:
    """
    Valida rostro con MediaPipe (misma familia que supervisión) y extrae embedding del recorte.

    Returns:
        (registered, message, reason_code, face_count, embedding)
    """
    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    detection = face_detector.detect(frame_rgb)
    face_count = detection.face_count

    if face_count == 0:
        return (
            False,
            "No vimos tu rostro. Centra la cara en la cámara, mejora la luz y quita objetos delante.",
            "no_face",
            0,
            None,
        )
    if face_count > 1:
        return (
            False,
            "Hay más de una persona en cámara. Debes estar solo para verificar tu identidad.",
            "multiple_faces",
            face_count,
            None,
        )

    crop = _crop_face_bgr(frame_bgr, detection.bounding_boxes[0])
    try:
        embedding = identity_verifier.extract_embedding(crop, enforce_detection=False)
    except Exception as exc:
        logger.warning("Identity embedding failed: %s", exc)
        return (
            False,
            "No pudimos analizar tu rostro. Intenta de nuevo con mejor iluminación.",
            "model_error",
            1,
            None,
        )

    if embedding is None:
        return (
            False,
            "No pudimos leer tu rostro con claridad. Acércate un poco y mira al frente.",
            "model_error",
            1,
            None,
        )

    return (
        True,
        "Identidad registrada correctamente.",
        "ok",
        1,
        embedding,
    )
