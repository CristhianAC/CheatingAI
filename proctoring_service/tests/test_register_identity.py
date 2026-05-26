"""Registro de identidad con gate MediaPipe + embedding."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import numpy as np
import pytest

from app.services.identity_registration_service import register_identity_from_frame
from app.services.vision.face_detector import FaceDetectionResult


@pytest.fixture
def frame_bgr():
    return np.zeros((480, 640, 3), dtype=np.uint8)


def test_register_identity_no_face(frame_bgr):
    face_detector = MagicMock()
    face_detector.detect.return_value = FaceDetectionResult(face_count=0)
    verifier = MagicMock()

    registered, message, code, fc, emb = register_identity_from_frame(
        frame_bgr, face_detector, verifier
    )

    assert registered is False
    assert code == "no_face"
    assert fc == 0
    assert emb is None
    verifier.extract_embedding.assert_not_called()


def test_register_identity_multiple_faces(frame_bgr):
    face_detector = MagicMock()
    face_detector.detect.return_value = FaceDetectionResult(
        face_count=2,
        bounding_boxes=[(0.1, 0.1, 0.3, 0.3), (0.5, 0.1, 0.3, 0.3)],
    )
    verifier = MagicMock()

    registered, _msg, code, fc, emb = register_identity_from_frame(
        frame_bgr, face_detector, verifier
    )

    assert registered is False
    assert code == "multiple_faces"
    assert fc == 2
    assert emb is None


def test_register_identity_one_face_success(frame_bgr):
    face_detector = MagicMock()
    face_detector.detect.return_value = FaceDetectionResult(
        face_count=1,
        bounding_boxes=[(0.2, 0.2, 0.4, 0.5)],
    )
    verifier = MagicMock()
    verifier.extract_embedding.return_value = [0.1] * 128

    registered, _msg, code, fc, emb = register_identity_from_frame(
        frame_bgr, face_detector, verifier
    )

    assert registered is True
    assert code == "ok"
    assert fc == 1
    assert emb is not None
    verifier.extract_embedding.assert_called_once()
    call_kwargs = verifier.extract_embedding.call_args.kwargs
    assert call_kwargs.get("enforce_detection") is False
