import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import OperationalError

from app.config import get_settings
from app.database import Base, engine
from app.routers import proctoring, sessions
from app.services.vision.detector import VisionDetector
from app.services.vision.identity_verifier import IdentityVerifier

logger = logging.getLogger(__name__)


def _apply_migrations(db_engine) -> None:
    """Add new columns to existing tables without dropping data."""
    inspector = inspect(db_engine)
    with db_engine.connect() as conn:
        tables = inspector.get_table_names()
        if "proctoring_sessions" in tables:
            existing = {c["name"] for c in inspector.get_columns("proctoring_sessions")}
            if "reference_embedding" not in existing:
                conn.execute(text(
                    "ALTER TABLE proctoring_sessions ADD COLUMN reference_embedding TEXT"
                ))
                conn.commit()
                logger.info("Migration applied: added reference_embedding column")

settings = get_settings()

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
        _apply_migrations(engine)
    except OperationalError as exc:
        logger.error("%s Detalle: %s", _DB_STARTUP_HINT, exc)
        raise

    # Inicializar VisionDetector una sola vez (carga de modelos MediaPipe es costosa)
    app.state.detector = VisionDetector()
    app.state.identity_verifier = IdentityVerifier()

    if settings.IDENTITY_WARMUP_ON_STARTUP:
        import time

        t0 = time.perf_counter()
        try:
            app.state.identity_verifier.warmup()
            logger.info(
                "Identity model warmup completed in %.1f s",
                time.perf_counter() - t0,
            )
        except Exception as exc:
            logger.warning("Identity warmup skipped: %s", exc)

    yield

    # Limpiar recursos MediaPipe al apagar
    app.state.detector.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API de supervisión de exámenes en tiempo real: cámara web y eventos del navegador. "
        "Señales como varias personas, ausencia en cámara, mirada desviada, teléfono visible, "
        "cambio de pestaña o foco, y verificación opcional de identidad."
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

app.include_router(proctoring.router, prefix="/api/v1")
app.include_router(sessions.router, prefix="/api/v1")


@app.get("/health", tags=["Health"], summary="Health check")
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION, "app": settings.APP_NAME}
