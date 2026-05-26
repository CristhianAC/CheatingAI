"""Regresión: VisionDetector debe inicializar gaze y phone en __init__."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import cv2
import numpy as np

from app.services.vision.detector import VisionDetector


def test_vision_detector_init_has_gaze_and_phone():
    with patch("app.services.vision.detector.FaceDetector") as face_cls:
        with patch("app.services.vision.detector.GazeEstimator") as gaze_cls:
            with patch("app.services.vision.detector.PhoneDetector") as phone_cls:
                face_cls.return_value = MagicMock()
                gaze_cls.return_value = MagicMock()
                phone_cls.return_value = MagicMock()

                detector = VisionDetector()

    assert hasattr(detector, "_gaze_estimator")
    assert hasattr(detector, "_phone_detector")
    assert detector.face_detector is detector._face_detector


def test_analyze_frame_does_not_raise_attribute_error():
    with patch("app.services.vision.detector.FaceDetector") as face_cls:
        with patch("app.services.vision.detector.GazeEstimator") as gaze_cls:
            with patch("app.services.vision.detector.PhoneDetector", side_effect=FileNotFoundError):
                face_mock = MagicMock()
                face_mock.detect.return_value = MagicMock(face_count=0)
                face_cls.return_value = face_mock
                gaze_cls.return_value = MagicMock()

                detector = VisionDetector()

    img = np.zeros((32, 32, 3), dtype=np.uint8)
    ok, buf = cv2.imencode(".jpg", img)
    assert ok
    result = detector.analyze_frame(buf.tobytes())
    assert result.person_count == 0
