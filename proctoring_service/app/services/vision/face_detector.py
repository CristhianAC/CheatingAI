from __future__ import annotations

from dataclasses import dataclass, field

import mediapipe as mp
import numpy as np

from app.config import get_settings

settings = get_settings()


@dataclass
class FaceDetectionResult:
    face_count: int
    bounding_boxes: list[tuple[float, float, float, float]] = field(default_factory=list)


class FaceDetector:
    """
    Uses MediaPipe Face Detection (BlazeFace) to count faces in a frame.

    model_selection=0: short range model (< 2m), ideal for webcam use.
    Input must be RGB (not BGR).
    """

    def __init__(self) -> None:
        self._detector = mp.solutions.face_detection.FaceDetection(
            model_selection=0,
            min_detection_confidence=settings.FACE_DETECTION_CONFIDENCE,
        )

    def detect(self, frame_rgb: np.ndarray) -> FaceDetectionResult:
        results = self._detector.process(frame_rgb)

        if not results.detections:
            return FaceDetectionResult(face_count=0)

        boxes = []
        for detection in results.detections:
            bbox = detection.location_data.relative_bounding_box
            boxes.append((bbox.xmin, bbox.ymin, bbox.width, bbox.height))

        return FaceDetectionResult(face_count=len(results.detections), bounding_boxes=boxes)

    def close(self) -> None:
        self._detector.close()
