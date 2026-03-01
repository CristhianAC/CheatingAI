from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.violation import ViolationType


class ViolationResponse(BaseModel):
    id: str
    session_id: str
    violation_type: ViolationType
    confidence: float = Field(..., ge=0.0, le=1.0)
    detected_at: datetime

    model_config = {"from_attributes": True}
