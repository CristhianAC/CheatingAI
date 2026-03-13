from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings

settings = get_settings()


def _database_url() -> str:
    url = settings.DATABASE_URL
    if url.strip().startswith("postgresql://") and "postgresql+" not in url.split("://")[0]:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def _connect_args() -> dict:
    if "sqlite" in settings.DATABASE_URL:
        return {"check_same_thread": False}
    return {}


engine = create_engine(
    _database_url(),
    connect_args=_connect_args(),
    echo=settings.DEBUG,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
