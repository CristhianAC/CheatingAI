from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CheatingAI - Plagiarism Detection API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./data/cheating_ai.db"

    REDIS_URL: str = "redis://redis:6379/0"

    WINNOWING_K: int = 5
    WINNOWING_W: int = 4
    DEFAULT_THRESHOLD: float = 0.7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
