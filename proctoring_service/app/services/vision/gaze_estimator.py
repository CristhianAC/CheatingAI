from __future__ import annotations

from dataclasses import dataclass

import mediapipe as mp
import numpy as np

from app.config import get_settings

settings = get_settings()


@dataclass
class GazeResult:
    yaw: float    # normalized [-1, 1]; negative=looking left, positive=looking right
    pitch: float  # normalized [-1, 1]; negative=looking down, positive=looking up
    detected: bool
    # Raw values exposed for diagnostics / frontend display
    nose_x: float = 0.0
    nose_y: float = 0.0
    face_height: float = 0.0


class GazeEstimator:
    """
    Estimates gaze direction using facial geometry ratios from MediaPipe Face Mesh.

    Uses landmark position ratios that are invariant to camera distance and focal
    length, avoiding the calibration problems of solvePnP with a generic 3D head.

    YAW (horizontal look-away):
      (nose_tip_x - face_center_x) / face_width
      Straight ahead = ~0. Looking right = positive. Looking left = negative.

    PITCH (up/down):
      Based on how much of the face is above vs below the nose.
      (nose_y - forehead_y) / face_height, baseline-corrected to 0 when straight.
      Looking down = negative (forehead rises, ratio drops below baseline).

    Thresholds in config.py are fractions of face size (not degrees).
    Recommended starting values: YAW_THRESHOLD=0.12, PITCH_THRESHOLD=0.07

    Landmarks used:
      1   - Nose tip
      10  - Forehead center
      152 - Chin
      234 - Left face edge
      454 - Right face edge
    """

    NOSE_TIP  = 1
    FOREHEAD  = 10
    CHIN      = 152
    LEFT_EDGE = 234
    RIGHT_EDGE = 454

    def __init__(self) -> None:
        self._mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=settings.FACE_DETECTION_CONFIDENCE,
            min_tracking_confidence=settings.FACE_MESH_CONFIDENCE,
        )

    def estimate(self, frame_rgb: np.ndarray) -> GazeResult:
        results = self._mesh.process(frame_rgb)

        if not results.multi_face_landmarks:
            return GazeResult(yaw=0.0, pitch=0.0, detected=False)

        lm = results.multi_face_landmarks[0].landmark

        nose_x     = lm[self.NOSE_TIP].x
        nose_y     = lm[self.NOSE_TIP].y
        forehead_y = lm[self.FOREHEAD].y
        chin_y     = lm[self.CHIN].y
        left_x     = lm[self.LEFT_EDGE].x
        right_x    = lm[self.RIGHT_EDGE].x

        face_width  = right_x - left_x
        face_height = chin_y - forehead_y
        face_center_x = (left_x + right_x) / 2.0

        if face_width < 0.01 or face_height < 0.01:
            return GazeResult(yaw=0.0, pitch=0.0, detected=False)

        # YAW: nose offset from horizontal face center, normalized by face width
        yaw = (nose_x - face_center_x) / face_width

        # PITCH: nose-to-forehead ratio corrected by baseline (~0.45 when straight)
        nose_to_forehead = (nose_y - forehead_y) / face_height
        pitch = -(nose_to_forehead - 0.45)

        return GazeResult(
            yaw=round(yaw, 4),
            pitch=round(pitch, 4),
            detected=True,
            nose_x=round(nose_x, 4),
            nose_y=round(nose_y, 4),
            face_height=round(face_height, 4),
        )

    def close(self) -> None:
        self._mesh.close()
