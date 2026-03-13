from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CheatingAI - Proctoring Service"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./data/proctoring.db"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_BUCKET: str = "proctoring-violations"

    # Gaze thresholds — fractions of face size (not degrees).
    # Calibrated for the ratio-based GazeEstimator.
    # YAW:   how far nose deviates horizontally from face center / face_width
    #        ~0.08 = noticeable side glance, ~0.14 = clear look-away
    GAZE_YAW_THRESHOLD: float = 0.12
    # PITCH: how much the nose-to-forehead ratio deviates from the straight-ahead baseline
    #        ~0.06 = head slightly tilted down, ~0.10 = clearly looking down
    GAZE_PITCH_THRESHOLD: float = 0.07

    # MediaPipe confidence thresholds
    FACE_DETECTION_CONFIDENCE: float = 0.5
    FACE_MESH_CONFIDENCE: float = 0.5

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
