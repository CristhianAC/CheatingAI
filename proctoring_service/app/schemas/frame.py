from __future__ import annotations

import base64
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.violation import ViolationType


class FrameAnalysisRequest(BaseModel):
    session_id: Optional[str] = Field(
        None,
        description="Active session ID to record violations against. If None, violations are not persisted.",
    )
    frame_base64: str = Field(
        ...,
        description="Base64-encoded image bytes (JPEG preferred for performance)",
    )

    @field_validator("frame_base64")
    @classmethod
    def strip_data_uri_prefix(cls, v: str) -> str:
        # Strip "data:image/jpeg;base64," prefix if sent by browser canvas.toDataURL()
        if "," in v and v.startswith("data:"):
            v = v.split(",", 1)[1]
        try:
            base64.b64decode(v, validate=True)
        except Exception:
            raise ValueError("frame_base64 must be valid base64-encoded image data")
        return v


class DetectedViolation(BaseModel):
    violation_type: ViolationType
    confidence: float = Field(..., ge=0.0, le=1.0)
    description: str


class FrameAnalysisResponse(BaseModel):
    person_count: int = Field(..., description="Number of faces detected in the frame")
    gaze_yaw: Optional[float] = Field(
        None, description="Horizontal gaze angle in degrees (negative=left, positive=right)"
    )
    gaze_pitch: Optional[float] = Field(
        None, description="Vertical gaze angle in degrees (negative=down, positive=up)"
    )
    violations: list[DetectedViolation]
    violations_persisted: bool = Field(
        False, description="True if violations were saved to DB (session_id was provided)"
    )
    processing_time_ms: float
