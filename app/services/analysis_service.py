import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.analysis_job import AnalysisJob, JobStatus, JobType
from app.models.comparison_result import ComparisonResult
from app.models.submission import Submission
from app.schemas.analysis_job import (
    BatchAnalysisRequest,
    JobProgressResponse,
    JobResponse,
    PairwiseAnalysisRequest,
)
from app.schemas.comparison_result import ComparisonResultResponse, JobResultsResponse
from app.services.plagiarism.comparator import compare_submissions


class AnalysisService:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ─── Pairwise ─────────────────────────────────────────────────────────────

    def run_pairwise(self, payload: PairwiseAnalysisRequest) -> ComparisonResultResponse:
        sub_a = self._get_submission_or_404(payload.submission_a_id)
        sub_b = self._get_submission_or_404(payload.submission_b_id)

        if sub_a.language != sub_b.language:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Las submissions tienen lenguajes distintos: "
                    f"{sub_a.language.value} vs {sub_b.language.value}"
                ),
            )

        # Crear job de tipo PAIRWISE para trazabilidad
        job = AnalysisJob(
            id=str(uuid.uuid4()),
            job_type=JobType.PAIRWISE,
            status=JobStatus.RUNNING,
            submission_a_id=sub_a.id,
            submission_b_id=sub_b.id,
            total_comparisons=1,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(job)
        self.db.flush()

        result = compare_submissions(
            code_a=sub_a.source_code,
            code_b=sub_b.source_code,
            hash_a=sub_a.code_hash,
            hash_b=sub_b.code_hash,
            language=sub_a.language,
        )

        comparison = ComparisonResult(
            id=str(uuid.uuid4()),
            job_id=job.id,
            submission_a_id=sub_a.id,
            submission_b_id=sub_b.id,
            similarity_score=result.similarity_score,
            is_exact_copy=result.is_exact_copy,
            threshold_used=payload.threshold,
            is_flagged=result.similarity_score >= payload.threshold,
            algorithm_details=result.algorithm_details,
        )
        self.db.add(comparison)

        job.status = JobStatus.COMPLETED
        job.completed_comparisons = 1
        job.finished_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(comparison)

        return ComparisonResultResponse.model_validate(comparison)

    # ─── Batch ────────────────────────────────────────────────────────────────

    def launch_batch(self, payload: BatchAnalysisRequest) -> JobResponse:
        # Verificar que hay al menos 2 submissions en el scope
        query = self.db.query(Submission)
        if payload.problem_id:
            query = query.filter(Submission.problem_id == payload.problem_id)
        elif payload.exam_id:
            query = query.filter(Submission.exam_id == payload.exam_id)

        count = query.count()
        if count < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Se necesitan al menos 2 submissions para el análisis batch (encontradas: {count})",
            )

        job = AnalysisJob(
            id=str(uuid.uuid4()),
            job_type=JobType.BATCH,
            status=JobStatus.PENDING,
            problem_id=payload.problem_id,
            exam_id=payload.exam_id,
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        # Encolar tarea Celery (importación diferida para evitar circular imports)
        from app.tasks.plagiarism_tasks import run_batch_analysis

        celery_task = run_batch_analysis.apply_async(
            kwargs={"job_id": job.id, "threshold": payload.threshold},
            queue="plagiarism",
        )

        job.celery_task_id = celery_task.id
        self.db.commit()
        self.db.refresh(job)

        return JobResponse.model_validate(job)

    # ─── Jobs ─────────────────────────────────────────────────────────────────

    def get_job(self, job_id: str) -> Optional[AnalysisJob]:
        return self.db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()

    def list_jobs(
        self,
        job_status: Optional[JobStatus],
        problem_id: Optional[str],
        exam_id: Optional[str],
        skip: int,
        limit: int,
    ) -> list[AnalysisJob]:
        query = self.db.query(AnalysisJob)
        if job_status:
            query = query.filter(AnalysisJob.status == job_status)
        if problem_id:
            query = query.filter(AnalysisJob.problem_id == problem_id)
        if exam_id:
            query = query.filter(AnalysisJob.exam_id == exam_id)
        return query.order_by(AnalysisJob.created_at.desc()).offset(skip).limit(limit).all()

    def build_progress_response(self, job: AnalysisJob) -> JobProgressResponse:
        total = job.total_comparisons or 0
        completed = job.completed_comparisons or 0
        progress = round((completed / total * 100), 1) if total > 0 else 0.0

        messages = {
            JobStatus.PENDING: "En cola, esperando worker disponible...",
            JobStatus.RUNNING: f"Analizando submissions... ({completed}/{total})",
            JobStatus.COMPLETED: "Análisis completado.",
            JobStatus.FAILED: f"Error: {job.error_message or 'desconocido'}",
        }

        return JobProgressResponse(
            job_id=job.id,
            status=job.status,
            progress_percent=progress,
            total_comparisons=total,
            completed_comparisons=completed,
            message=messages[job.status],
        )

    def get_job_results(
        self,
        job_id: str,
        flagged_only: bool,
        min_score: float,
        skip: int,
        limit: int,
    ) -> JobResultsResponse:
        job = self.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job no encontrado")

        if job.status != JobStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El job aún no ha completado (estado actual: {job.status.value})",
            )

        query = self.db.query(ComparisonResult).filter(ComparisonResult.job_id == job_id)

        if flagged_only:
            query = query.filter(ComparisonResult.is_flagged == True)  # noqa: E712
        if min_score > 0.0:
            query = query.filter(ComparisonResult.similarity_score >= min_score)

        total = query.count()
        flagged_count = (
            self.db.query(ComparisonResult)
            .filter(ComparisonResult.job_id == job_id, ComparisonResult.is_flagged == True)  # noqa: E712
            .count()
        )

        results = query.order_by(ComparisonResult.similarity_score.desc()).offset(skip).limit(limit).all()

        # Leer threshold del primer resultado (todos usan el mismo en un job)
        threshold_used = results[0].threshold_used if results else 0.7

        return JobResultsResponse(
            job_id=job_id,
            status=job.status.value,
            total_comparisons=total,
            flagged_count=flagged_count,
            threshold_used=threshold_used,
            results=[ComparisonResultResponse.model_validate(r) for r in results],
            skip=skip,
            limit=limit,
        )

    # ─── Helpers ──────────────────────────────────────────────────────────────

    def _get_submission_or_404(self, submission_id: str) -> Submission:
        sub = self.db.query(Submission).filter(Submission.id == submission_id).first()
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Submission '{submission_id}' no encontrada",
            )
        return sub
