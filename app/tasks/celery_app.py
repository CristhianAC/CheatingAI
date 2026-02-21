from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "cheating_ai",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.plagiarism_tasks"],
)

celery_app.conf.update(
    # Serialización
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Comportamiento de tareas
    task_track_started=True,
    task_acks_late=True,           # La tarea se confirma solo cuando termina
    worker_prefetch_multiplier=1,  # 1 tarea por worker a la vez (justo para batch)

    # Resultados: conservar 24 horas
    result_expires=86400,

    # Reintentos
    task_max_retries=3,
    task_default_retry_delay=60,

    # Routing
    task_default_queue="plagiarism",
    task_queues={
        "plagiarism": {"exchange": "plagiarism", "routing_key": "plagiarism"},
    },
)
