from __future__ import annotations

import os
from dataclasses import dataclass

import mediapipe as mp
import numpy as np
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.core import base_options as mp_base_options

# Path to the EfficientDet-Lite0 COCO model downloaded in the Docker image
_MODEL_PATH = os.environ.get(
    "PHONE_DETECTOR_MODEL_PATH",
    "/app/models/efficientdet_lite0.tflite",
)
_SCORE_THRESHOLD = 0.45  # min confidence to count as "cell phone" detection


@dataclass
class PhoneDetectionResult:
    phone_likely: bool
    confidence: float
    reason: str


class PhoneDetector:
    """
    Detects cell phones in a frame using MediaPipe Object Detector
    with EfficientDet-Lite0 trained on COCO (80 classes, includes 'cell phone').

    This replaces the previous heuristic approach (hand pose + gaze pitch)
    with actual object detection, which directly identifies the phone object
    regardless of how the student holds it or where they look.

    Model: efficientdet_lite0.tflite (INT8, ~4MB)
    Source: storage.googleapis.com/mediapipe-models/object_detector/
    """

    PHONE_LABEL = "cell phone"

    def __init__(self) -> None:
        if not os.path.exists(_MODEL_PATH):
            raise FileNotFoundError(
                f"Object detection model not found at {_MODEL_PATH}. "
                "Ensure the Docker image was built with the model downloaded."
            )

        base_options = mp_base_options.BaseOptions(model_asset_path=_MODEL_PATH)
        options = mp_vision.ObjectDetectorOptions(
            base_options=base_options,
            running_mode=mp_vision.RunningMode.IMAGE,
            score_threshold=_SCORE_THRESHOLD,
            max_results=10,
        )
        self._detector = mp_vision.ObjectDetector.create_from_options(options)

    def detect(self, frame_rgb: np.ndarray, gaze_pitch: float = 0.0) -> PhoneDetectionResult:
        """
        Args:
            frame_rgb: HxWx3 uint8 RGB image
            gaze_pitch: unused — kept for API compatibility with detector.py
        Returns:
            PhoneDetectionResult
        """
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        result = self._detector.detect(mp_image)

        best_confidence = 0.0
        for detection in result.detections:
            for category in detection.categories:
                if category.category_name == self.PHONE_LABEL:
                    if category.score > best_confidence:
                        best_confidence = category.score

        if best_confidence >= _SCORE_THRESHOLD:
            return PhoneDetectionResult(
                phone_likely=True,
                confidence=round(best_confidence, 2),
                reason=f"Cell phone detected (confidence={best_confidence:.0%})",
            )

        return PhoneDetectionResult(
            phone_likely=False,
            confidence=0.0,
            reason="No phone detected",
        )

    def close(self) -> None:
        self._detector.close()
