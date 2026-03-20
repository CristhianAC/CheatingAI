from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.session import SessionStatus
from app.schemas.violation import ViolationWithSnapshot


class SessionCreate(BaseModel):
    exam_id: str = Field(..., min_length=1, max_length=100, examples=["exam-2024-01"])
    student_id: str = Field(..., min_length=1, max_length=100, examples=["student-001"])


# ---------------------------------------------------------------------------
# Risk assessment schemas (returned as part of SessionReport)
# ---------------------------------------------------------------------------


class SuspiciousClusterSchema(BaseModel):
    window_start: datetime
    window_end: datetime
    violation_count: int
    violation_types: list[str]


class RiskAlertSchema(BaseModel):
    severity: str          # "critico", "alto", "medio", "bajo"
    title: str
    description: str
    evidence_count: int
    first_at: Optional[datetime] = None
    last_at: Optional[datetime] = None


class RiskAssessmentSchema(BaseModel):
    score: int             # 0-100
    level: str             # "bajo", "medio", "alto", "critico"
    level_label: str       # human-readable verdict
    level_color: str       # "green", "yellow", "orange", "red"
    summary: str           # one-sentence conclusion for the professor
    alerts: list[RiskAlertSchema]
    suspicious_clusters: list[SuspiciousClusterSchema]
    critical_findings: list[str]
    behavioral_notes: list[str]


class SessionResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SessionSummaryResponse(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_violations: int
    violations_by_type: dict[str, int]

    model_config = {"from_attributes": True}


class ExamSummary(BaseModel):
    exam_id: str
    students_count: int
    last_activity: Optional[datetime] = None


class ExamSessionListItem(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SessionReport(BaseModel):
    id: str
    exam_id: str
    student_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_seconds: float
    total_violations: int
    violations_by_type: dict[str, int]
    violations: list[ViolationWithSnapshot]
    risk_assessment: RiskAssessmentSchema
