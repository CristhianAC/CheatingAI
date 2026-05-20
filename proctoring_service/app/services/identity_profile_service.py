"""Comparación de capturas periódicas contra la foto de perfil del estudiante."""

from __future__ import annotations

import logging
import uuid
from typing import Optional

import cv2
import numpy as np
import httpx
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.violation import ViolationType
from app.services.identity_constants import IDENTITY_THRESHOLD
from app.services.vision.detector import ViolationDetected
from app.services.vision.identity_verifier import IdentityVerifier

logger = logging.getLogger(__name__)

_verifier = IdentityVerifier()
_profile_embedding_cache: dict[str, list[float]] = {}


def _download_image_bgr(url: str) -> Optional[np.ndarray]:
    try:
        with httpx.Client(timeout=15.0, follow_redirects=True) as client:
            resp = client.get(url)
            resp.raise_for_status()
            arr = np.frombuffer(resp.content, np.uint8)
            bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            return bgr
    except Exception as exc:
        logger.warning("No se pudo descargar foto de perfil desde %s: %s", url[:80], exc)
        return None


def get_profile_embedding(db: Session, student_id: str) -> Optional[list[float]]:
    if student_id in _profile_embedding_cache:
        return _profile_embedding_cache[student_id]

    try:
        uid = uuid.UUID(str(student_id))
    except ValueError:
        logger.warning("student_id inválido para foto de perfil: %s", student_id)
        return None

    user = db.query(User).filter(User.id == uid).first()
    if not user or not user.photo_url:
        logger.info("Estudiante %s sin photo_url; se omite verificación de identidad.", student_id)
        return None

    bgr = _download_image_bgr(user.photo_url)
    if bgr is None:
        return None

    embedding = _verifier.extract_embedding(bgr)
    if embedding is None:
        logger.warning("No se extrajo embedding de la foto de perfil del estudiante %s", student_id)
        return None

    _profile_embedding_cache[student_id] = embedding
    return embedding


def compare_frame_to_profile(
    db: Session,
    student_id: str,
    frame_bgr: np.ndarray,
) -> tuple[Optional[ViolationDetected], float | None]:
    """
    Compara el frame actual con la foto de perfil.

    Returns:
        (violation si mismatch, similarity si hubo rostro detectado)
    """
    reference = get_profile_embedding(db, student_id)
    if reference is None:
        return None, None

    current = _verifier.extract_embedding(frame_bgr)
    if current is None:
        return None, None

    _is_same, similarity = _verifier.compare(reference, current)
    if similarity >= IDENTITY_THRESHOLD:
        return None, similarity

    confidence = round(max(0.0, min(1.0, 1.0 - similarity)), 4)
    return (
        ViolationDetected(
            violation_type=ViolationType.IDENTITY_MISMATCH,
            confidence=confidence,
            description=(
                f"Persona diferente a la foto de perfil "
                f"(similitud={similarity:.2f}, umbral={IDENTITY_THRESHOLD})"
            ),
        ),
        similarity,
    )
