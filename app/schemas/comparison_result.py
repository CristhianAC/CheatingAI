from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AlgorithmDetails(BaseModel):
    fingerprints_a: int
    fingerprints_b: int
    common_fingerprints: int
    k: int
    w: int


class ComparisonResultResponse(BaseModel):
    id: str
    job_id: str
    submission_a_id: str
    submission_b_id: str
    similarity_score: float = Field(..., ge=0.0, le=1.0)
    is_exact_copy: bool
    threshold_used: float
    is_flagged: bool
    algorithm_details: Optional[AlgorithmDetails]
    created_at: datetime

    model_config = {"from_attributes": True}


class JobResultsResponse(BaseModel):
    job_id: str
    status: str
    total_comparisons: int
    flagged_count: int
    threshold_used: float
    results: list[ComparisonResultResponse]
    skip: int
    limit: int
