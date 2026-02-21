from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.analysis_job import JobStatus
from app.schemas.analysis_job import JobProgressResponse, JobResponse
from app.schemas.comparison_result import JobResultsResponse
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get(
    "/",
    response_model=list[JobResponse],
    summary="Listar todos los jobs de análisis",
)
def list_jobs(
    job_status: Optional[JobStatus] = Query(None, alias="status"),
    problem_id: Optional[str] = Query(None),
    exam_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return AnalysisService(db).list_jobs(job_status, problem_id, exam_id, skip, limit)


@router.get(
    "/{job_id}",
    response_model=JobProgressResponse,
    summary="Consultar estado y progreso de un job",
)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    svc = AnalysisService(db)
    job = svc.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job no encontrado")
    return svc.build_progress_response(job)


@router.get(
    "/{job_id}/results",
    response_model=JobResultsResponse,
    summary="Obtener resultados de comparaciones de un job completado",
)
def get_job_results(
    job_id: str,
    flagged_only: bool = Query(False, description="Solo pares marcados como plagio"),
    min_score: float = Query(0.0, ge=0.0, le=1.0),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    return AnalysisService(db).get_job_results(job_id, flagged_only, min_score, skip, limit)
