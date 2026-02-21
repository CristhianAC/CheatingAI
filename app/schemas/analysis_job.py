from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.models.analysis_job import JobStatus, JobType


class PairwiseAnalysisRequest(BaseModel):
    submission_a_id: str = Field(..., description="ID de la primera submission")
    submission_b_id: str = Field(..., description="ID de la segunda submission")
    threshold: float = Field(
        0.7,
        ge=0.0,
        le=1.0,
        description="Umbral de similitud para marcar como plagio (0.0-1.0)",
    )

    @model_validator(mode="after")
    def submissions_must_differ(self) -> PairwiseAnalysisRequest:
        if self.submission_a_id == self.submission_b_id:
            raise ValueError("submission_a_id y submission_b_id deben ser distintos")
        return self


class BatchAnalysisRequest(BaseModel):
    problem_id: Optional[str] = Field(None, description="Analizar todas las submissions de un problema")
    exam_id: Optional[str] = Field(None, description="Analizar todas las submissions de un examen/parcial")
    threshold: float = Field(0.7, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def must_have_scope(self) -> BatchAnalysisRequest:
        if not self.problem_id and not self.exam_id:
            raise ValueError("Debes especificar problem_id o exam_id")
        return self


class JobResponse(BaseModel):
    id: str
    job_type: JobType
    status: JobStatus
    problem_id: Optional[str]
    exam_id: Optional[str]
    submission_a_id: Optional[str]
    submission_b_id: Optional[str]
    total_comparisons: int
    completed_comparisons: int
    celery_task_id: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]

    model_config = {"from_attributes": True}


class JobProgressResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress_percent: float
    total_comparisons: int
    completed_comparisons: int
    message: str
