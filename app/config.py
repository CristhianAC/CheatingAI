from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CheatingAI - Plagiarism Detection API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./data/cheating_ai.db"

    # Opcionales: útiles para migraciones y para compartir .env con otros servicios
    DIRECT_URL: str | None = None
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_KEY: str | None = None
    SUPABASE_BUCKET: str | None = None
    # Bucket para fotos de perfil (p. ej. profile-photos). Debe existir y ser público para URLs directas.
    SUPABASE_PROFILE_BUCKET: str | None = "profile-photos"

    REDIS_URL: str = "redis://redis:6379/0"

    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    WINNOWING_K: int = 5
    WINNOWING_W: int = 4
    DEFAULT_THRESHOLD: float = 0.7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
