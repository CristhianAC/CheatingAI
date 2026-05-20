import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from app.config import get_settings
from app.database import Base, engine
from app.models.exam import Exam  # noqa: F401
from app.models.user import User  # noqa: F401
from app.routers import analysis, auth, exams, jobs, submissions, users

settings = get_settings()
logger = logging.getLogger(__name__)

_DB_STARTUP_HINT = (
    "No se pudo conectar a la base de datos. Revisa DATABASE_URL en .env "
    "(Supabase: conexión directa db.[ref].supabase.co o pooler con usuario "
    "postgres.[ref] y host/puerto del dashboard). Ver README troubleshooting."
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear directorio de datos para SQLite si no existe
    if "sqlite" in settings.DATABASE_URL:
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

    try:
        Base.metadata.create_all(bind=engine)
    except OperationalError as exc:
        logger.error("%s Detalle: %s", _DB_STARTUP_HINT, exc)
        raise
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API REST de detección de plagio de código para la plataforma CODER. "
        "Implementa el algoritmo Winnowing con tokenización por lenguaje "
        "para detectar similitudes estructurales entre submissions de estudiantes."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(submissions.router, prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(exams.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")


@app.get("/health", tags=["Health"], summary="Health check")
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION, "app": settings.APP_NAME}
