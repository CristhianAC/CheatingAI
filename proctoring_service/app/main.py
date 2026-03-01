import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.routers import proctoring, sessions
from app.services.vision.detector import VisionDetector

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear directorio de datos para SQLite si no existe
    if "sqlite" in settings.DATABASE_URL:
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

    # Crear todas las tablas al arrancar
    Base.metadata.create_all(bind=engine)

    # Inicializar VisionDetector una sola vez (carga de modelos MediaPipe es costosa)
    app.state.detector = VisionDetector()

    yield

    # Limpiar recursos MediaPipe al apagar
    app.state.detector.close()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Microservicio de supervisión de exámenes en tiempo real mediante cámara web. "
        "Detecta comportamientos sospechosos: múltiples personas, ausencia del estudiante, "
        "mirada fuera de pantalla y uso del teléfono. Usa MediaPipe (Google) sin costo."
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
