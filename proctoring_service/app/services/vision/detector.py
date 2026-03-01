from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional

import cv2
import numpy as np

from app.models.violation import ViolationType
from app.services.vision.face_detector import FaceDetector
from app.services.vision.gaze_estimator import GazeEstimator
from app.services.vision.phone_detector import PhoneDetector
from app.config import get_settings

settings = get_settings()


@dataclass
class ViolationDetected:
    violation_type: ViolationType
    confidence: float
    description: str


@dataclass
class AnalysisResult:
    person_count: int
    gaze_yaw: Optional[float]
    gaze_pitch: Optional[float]
    violations: list[ViolationDetected] = field(default_factory=list)
    processing_time_ms: float = 0.0


class VisionDetector:
    """
    Orchestrates all vision detectors for a single frame analysis.

    Instantiated ONCE at startup (FastAPI lifespan) and stored in app.state.
    """

    def __init__(self) -> None:
        self._face_detector = FaceDetector()
        self._gaze_estimator = GazeEstimator()
        try:
            self._phone_detector: PhoneDetector | None = PhoneDetector()
        except FileNotFoundError as e:
            # Model not downloaded yet — phone detection disabled, service still starts
            import logging
            logging.getLogger(__name__).warning("Phone detector disabled: %s", e)
            self._phone_detector = None

    def analyze_frame(self, frame_bytes: bytes) -> AnalysisResult:
        start = time.perf_counter()

        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame_bgr is None:
            raise ValueError("Could not decode image from provided bytes")

        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        violations: list[ViolationDetected] = []

        # 1. Count persons
        face_result = self._face_detector.detect(frame_rgb)
        person_count = face_result.face_count

        if person_count == 0:
            violations.append(ViolationDetected(
                violation_type=ViolationType.NO_PERSON,
                confidence=0.95,
                description="No person detected in frame",
            ))
        elif person_count > 1:
            violations.append(ViolationDetected(
                violation_type=ViolationType.MULTIPLE_PERSONS,
                confidence=min(0.7 + (person_count - 2) * 0.1, 0.99),
                description=f"{person_count} persons detected in frame",
            ))

        gaze_yaw = None
        gaze_pitch = None

        if person_count == 1:
            gaze_result = self._gaze_estimator.estimate(frame_rgb)

            if gaze_result.detected:
                gaze_yaw = gaze_result.yaw
                gaze_pitch = gaze_result.pitch

                # 2. Look-away detection (horizontal)
                if abs(gaze_result.yaw) > settings.GAZE_YAW_THRESHOLD:
                    direction = "derecha" if gaze_result.yaw > 0 else "izquierda"
                    # Confidence scales with how far past the threshold the yaw is
                    excess = abs(gaze_result.yaw) - settings.GAZE_YAW_THRESHOLD
                    confidence = min(0.6 + (excess / settings.GAZE_YAW_THRESHOLD) * 0.35, 0.98)
                    violations.append(ViolationDetected(
                        violation_type=ViolationType.LOOKING_AWAY,
                        confidence=round(confidence, 2),
                        description=f"Mirando a la {direction} (yaw={gaze_result.yaw:.3f})",
                    ))

                # 3. Phone detection via object detection (EfficientDet-Lite0 COCO)
                if self._phone_detector is not None:
                    phone_result = self._phone_detector.detect(frame_rgb)
                    if phone_result.phone_likely:
                        violations.append(ViolationDetected(
                            violation_type=ViolationType.PHONE_DETECTED,
                            confidence=phone_result.confidence,
                            description=phone_result.reason,
                        ))

        elapsed_ms = (time.perf_counter() - start) * 1000

        return AnalysisResult(
            person_count=person_count,
            gaze_yaw=gaze_yaw,
            gaze_pitch=gaze_pitch,
            violations=violations,
            processing_time_ms=round(elapsed_ms, 2),
        )

    def close(self) -> None:
        self._face_detector.close()
        self._gaze_estimator.close()
        if self._phone_detector is not None:
            self._phone_detector.close()
