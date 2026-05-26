from __future__ import annotations

import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

# Facenet cosine-distance threshold: < 0.40 → same person (deepface default)
_MODEL_NAME = "Facenet"
_COSINE_DISTANCE_THRESHOLD = 0.40


class IdentityVerifier:
    """
    Extracts 128-d face embeddings using DeepFace (Facenet backend) and
    compares them via cosine similarity to verify student identity.

    DeepFace and its dependencies (tf-keras, tensorflow) are imported lazily
    so they don't slow down the service startup if identity features are unused.
    """

    def extract_embedding(
        self,
        frame_bgr: np.ndarray,
        *,
        enforce_detection: bool = False,
    ) -> Optional[list[float]]:
        """
        Extract a face embedding from a BGR frame (ideally a MediaPipe crop).
        Returns None if extraction fails.
        """
        try:
            from deepface import DeepFace  # lazy import — heavy dependency

            results = DeepFace.represent(
                img_path=frame_bgr,
                model_name=_MODEL_NAME,
                enforce_detection=enforce_detection,
                detector_backend="skip" if not enforce_detection else "opencv",
                align=True,
            )
            return results[0]["embedding"]
        except Exception as exc:
            logger.debug("Identity embedding extraction failed: %s", exc)
            return None

    def warmup(self, frame_bgr: np.ndarray | None = None) -> None:
        """Carga DeepFace/Facenet una vez al arranque del servicio."""
        import numpy as np

        img = frame_bgr
        if img is None:
            img = np.full((64, 64, 3), 128, dtype=np.uint8)
        self.extract_embedding(img, enforce_detection=False)

    def compare(
        self,
        reference: list[float],
        current: list[float],
    ) -> tuple[bool, float]:
        """
        Compare two embeddings.

        Returns:
            (is_same_person, cosine_similarity)
            cosine_similarity is in [0, 1]; higher = more similar.
            is_same_person is True when cosine_distance < threshold.
        """
        e1 = np.array(reference, dtype=np.float32)
        e2 = np.array(current, dtype=np.float32)

        norm1 = np.linalg.norm(e1)
        norm2 = np.linalg.norm(e2)
        if norm1 == 0 or norm2 == 0:
            return False, 0.0

        similarity = float(np.dot(e1, e2) / (norm1 * norm2))
        cosine_distance = 1.0 - similarity
        is_same = cosine_distance < _COSINE_DISTANCE_THRESHOLD
        return is_same, similarity
