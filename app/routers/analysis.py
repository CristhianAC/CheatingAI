from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.schemas.analysis_job import BatchAnalysisRequest, JobResponse, PairwiseAnalysisRequest
from app.schemas.comparison_result import ComparisonResultResponse
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post(
    "/pairwise",
    response_model=ComparisonResultResponse,
    status_code=status.HTTP_200_OK,
    summary="Comparar dos submissions específicas (síncrono)",
    description=(
        "Ejecuta el algoritmo Winnowing de forma síncrona para comparar "
        "exactamente dos submissions. Retorna el resultado inmediatamente."
    ),
)
def pairwise_analysis(payload: PairwiseAnalysisRequest, db: Session = Depends(get_db)):
    return AnalysisService(db).run_pairwise(payload)


@router.post(
    "/batch",
    response_model=JobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Lanzar análisis batch asincrónico",
    description=(
        "Encola una tarea Celery para comparar O(n²) pares de submissions "
        "de un problema o examen. Retorna inmediatamente con el job_id."
    ),
)
def batch_analysis(payload: BatchAnalysisRequest, db: Session = Depends(get_db)):
    return AnalysisService(db).launch_batch(payload)
