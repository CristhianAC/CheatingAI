import base64

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.dependencies import get_db
from app.schemas.frame import DetectedViolation, FrameAnalysisRequest, FrameAnalysisResponse
from app.services.session_service import SessionService
from app.services.violation_service import ViolationService

router = APIRouter(prefix="/proctoring", tags=["Proctoring"])
settings = get_settings()


@router.post(
    "/analyze-frame",
    response_model=FrameAnalysisResponse,
    summary="Analyze a single video frame for proctoring violations",
)
def analyze_frame(
    payload: FrameAnalysisRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    detector = request.app.state.detector

    try:
        frame_bytes = base64.b64decode(payload.frame_base64)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 image data")

    try:
        result = detector.analyze_frame(frame_bytes)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))

    response_violations: list[DetectedViolation] = [
        DetectedViolation(
            violation_type=v.violation_type,
            confidence=v.confidence,
            description=v.description,
        )
        for v in result.violations
    ]

    violations_persisted = False
    if payload.session_id and result.violations:
        session = SessionService(db).get_by_id(payload.session_id)
        if session and session.status.value == "active":
            violation_svc = ViolationService(db)
            for v in result.violations:
                violation_svc.record(
                    session_id=payload.session_id,
                    violation_type=v.violation_type,
                    confidence=v.confidence,
                )
            violations_persisted = True

    return FrameAnalysisResponse(
        person_count=result.person_count,
        gaze_yaw=result.gaze_yaw,
        gaze_pitch=result.gaze_pitch,
        violations=response_violations,
        violations_persisted=violations_persisted,
        processing_time_ms=result.processing_time_ms,
    )


# ── Calibration endpoint ──────────────────────────────────────────────────────

class CalibrateRequest(BaseModel):
    frame_base64: str

    @classmethod
    def __get_validators__(cls):
        yield cls._validate

    @classmethod
    def _validate(cls, v):
        return v


class CalibrateResponse(BaseModel):
    detected: bool
    gaze_yaw: float | None
    gaze_pitch: float | None
    thresholds: dict
    yaw_ok: bool       # True = within normal range (no violation)
    pitch_ok: bool
    raw: dict          # nose_x, nose_y, face_height for debugging


@router.post(
    "/calibrate",
    response_model=CalibrateResponse,
    summary="Raw gaze values without violation logic — use this to tune thresholds",
)
def calibrate(payload: FrameAnalysisRequest, request: Request):
    """
    Returns raw landmark ratios WITHOUT applying violation thresholds.
    Use this endpoint in the UI to see what yaw/pitch values your face produces
    in different positions, then adjust GAZE_YAW_THRESHOLD and GAZE_PITCH_THRESHOLD.
    """
    detector = request.app.state.detector

    try:
        frame_bytes = base64.b64decode(payload.frame_base64)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid base64 image data")

    import cv2
    import numpy as np
    nparr = np.frombuffer(frame_bytes, np.uint8)
    frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame_bgr is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not decode image")

    frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    gaze = detector._gaze_estimator.estimate(frame_rgb)

    return CalibrateResponse(
        detected=gaze.detected,
        gaze_yaw=gaze.yaw if gaze.detected else None,
        gaze_pitch=gaze.pitch if gaze.detected else None,
        thresholds={
            "yaw_threshold": settings.GAZE_YAW_THRESHOLD,
            "pitch_threshold": settings.GAZE_PITCH_THRESHOLD,
        },
        yaw_ok=abs(gaze.yaw) <= settings.GAZE_YAW_THRESHOLD if gaze.detected else True,
        pitch_ok=gaze.pitch >= -settings.GAZE_PITCH_THRESHOLD if gaze.detected else True,
        raw={
            "nose_x": gaze.nose_x,
            "nose_y": gaze.nose_y,
            "face_height": gaze.face_height,
        },
    )
