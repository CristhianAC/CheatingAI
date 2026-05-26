from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Procto"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./data/proctoring.db"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "proctoring-violations"
    SUPABASE_VIOLATION_CAPTURES_BUCKET: str = "proctoring-violations"

    # Gaze thresholds — fractions of face size (not degrees).
    # Calibrated for the ratio-based GazeEstimator.
    # YAW:   how far nose deviates horizontally from face center / face_width
    #        ~0.08 = noticeable side glance, ~0.14 = clear look-away
    # Ajuste 2026-05: avisos de mirada un poco antes (feedback estudiante).
    GAZE_YAW_THRESHOLD: float = 0.09
    # PITCH: how much the nose-to-forehead ratio deviates from the straight-ahead baseline
    #        ~0.06 = head slightly tilted down, ~0.10 = clearly looking down
    GAZE_PITCH_THRESHOLD: float = 0.07

    # MediaPipe confidence thresholds
    FACE_DETECTION_CONFIDENCE: float = 0.5
    FACE_MESH_CONFIDENCE: float = 0.5

    # Violation persistence — reduce false positives and only store photos for strong signals.
    # Below PERSIST_MIN the event is not written to the DB.
    # At or above SNAPSHOT_MIN a frame is uploaded when storage is configured.
    VIOLATION_PERSIST_MIN_CONFIDENCE: float = 0.75
    VIOLATION_SNAPSHOT_MIN_CONFIDENCE: float = 0.90
    # Ajuste 2026-05: bajar el listón de persistencia para avisos menos extremos.
    LOOKING_AWAY_PERSIST_MIN_CONFIDENCE: float = 0.76
    VIOLATION_COOLDOWN_SECONDS: int = 8
    VIOLATION_COOLDOWN_CONFIDENCE_BUMP: float = 0.05

    # Gaze: require consecutive frames before persisting looking_away (reduces false positives).
    GAZE_CONSECUTIVE_FRAMES_REQUIRED: int = 2

    # Reconnect to an in-progress session within this window (minutes).
    SESSION_RESUME_WINDOW_MINUTES: int = 15

    # Identity registration at session start (DeepFace + MediaPipe gate).
    IDENTITY_WARMUP_ON_STARTUP: bool = True
    IDENTITY_AUTO_MAX_ATTEMPTS: int = 3
    IDENTITY_CLIENT_MIN_VIDEO_WIDTH: int = 320
    IDENTITY_REGISTER_TIMEOUT_SECONDS: int = 45

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
