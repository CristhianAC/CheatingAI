import logging
from datetime import datetime, timezone
from itertools import combinations

from celery import Task

from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

BATCH_SAVE_EVERY = 50  # Guardar en DB cada N resultados para reducir I/O


class PlagiarismTask(Task):
    """Task base con manejo de errores y actualización de estado en DB."""

    abstract = True

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        from app.database import SessionLocal
        from app.models.analysis_job import AnalysisJob, JobStatus

        db = SessionLocal()
        try:
            job_id = kwargs.get("job_id")
            if job_id:
                job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
                if job:
                    job.status = JobStatus.FAILED
                    job.error_message = str(exc)[:500]
                    job.finished_at = datetime.now(timezone.utc)
                    db.commit()
        finally:
            db.close()


@celery_app.task(
    bind=True,
    base=PlagiarismTask,
    name="tasks.run_batch_analysis",
    max_retries=3,
)
def run_batch_analysis(self, job_id: str, threshold: float):
    """
    Tarea Celery para análisis batch O(n²).

    Flujo:
    1. Cargar el job desde la DB y marcarlo como RUNNING
    2. Obtener todas las submissions del scope (problem_id o exam_id)
    3. Generar todos los pares con itertools.combinations
    4. Comparar cada par con el algoritmo Winnowing
    5. Guardar resultados en lotes de BATCH_SAVE_EVERY para eficiencia
    6. Actualizar progreso periódicamente
    7. Marcar el job como COMPLETED al terminar
    """
    from app.database import SessionLocal
    from app.models.analysis_job import AnalysisJob, JobStatus
    from app.models.comparison_result import ComparisonResult
    from app.models.submission import Submission
    from app.services.plagiarism.comparator import compare_submissions

    db = SessionLocal()
    try:
        # 1. Cargar job
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            raise ValueError(f"Job {job_id} no encontrado")

        job.status = JobStatus.RUNNING
        job.started_at = datetime.now(timezone.utc)
        db.commit()

        # 2. Obtener submissions del scope
        query = db.query(Submission)
        if job.problem_id:
            query = query.filter(Submission.problem_id == job.problem_id)
        elif job.exam_id:
            query = query.filter(Submission.exam_id == job.exam_id)
        submissions = query.all()

        if len(submissions) < 2:
            job.status = JobStatus.COMPLETED
            job.total_comparisons = 0
            job.finished_at = datetime.now(timezone.utc)
            db.commit()
            return {"job_id": job_id, "comparisons": 0}

        # 3. Calcular total de comparaciones O(n²)
        pairs = list(combinations(submissions, 2))
        total = len(pairs)
        job.total_comparisons = total
        db.commit()

        logger.info(f"Job {job_id}: iniciando {total} comparaciones")

        # 4. Comparar todos los pares
        results_buffer: list[ComparisonResult] = []

        for idx, (sub_a, sub_b) in enumerate(pairs, start=1):
            # Saltar pares de distintos lenguajes (no comparables)
            if sub_a.language != sub_b.language:
                total -= 1
                continue

            result = compare_submissions(
                code_a=sub_a.source_code,
                code_b=sub_b.source_code,
                hash_a=sub_a.code_hash,
                hash_b=sub_b.code_hash,
                language=sub_a.language,
            )

            import uuid
            comparison = ComparisonResult(
                id=str(uuid.uuid4()),
                job_id=job_id,
                submission_a_id=sub_a.id,
                submission_b_id=sub_b.id,
                similarity_score=result.similarity_score,
                is_exact_copy=result.is_exact_copy,
                threshold_used=threshold,
                is_flagged=result.similarity_score >= threshold,
                algorithm_details=result.algorithm_details,
            )
            results_buffer.append(comparison)

            # 5. Guardar en lotes
            if len(results_buffer) >= BATCH_SAVE_EVERY:
                db.bulk_save_objects(results_buffer)
                job.completed_comparisons = idx
                db.commit()
                results_buffer = []

                # Actualizar estado en Celery (para Flower)
                self.update_state(
                    state="PROGRESS",
                    meta={"current": idx, "total": total},
                )
                logger.info(f"Job {job_id}: {idx}/{total} comparaciones completadas")

        # Guardar remanentes
        if results_buffer:
            db.bulk_save_objects(results_buffer)

        # 7. Marcar como completado
        job.status = JobStatus.COMPLETED
        job.total_comparisons = total
        job.completed_comparisons = total
        job.finished_at = datetime.now(timezone.utc)
        db.commit()

        logger.info(f"Job {job_id} completado: {total} comparaciones")
        return {"job_id": job_id, "comparisons": total}

    except Exception as exc:
        db.rollback()
        logger.exception(f"Error en job {job_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)
    finally:
        db.close()
