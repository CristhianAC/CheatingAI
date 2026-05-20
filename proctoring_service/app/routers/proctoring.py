import base64
import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import get_settings
from app.dependencies import get_db
from app.models.violation import ViolationType
from app.schemas.frame import DetectedViolation, FrameAnalysisRequest, FrameAnalysisResponse
from app.services.frame_persistence import persist_frame_analysis, reset_absent_streak
from app.services.session_service import SessionService
from app.services.storage import upload_identity_violation_capture
from app.services.vision.identity_verifier import IdentityVerifier
from app.services.violation_service import ViolationService

router = APIRouter(prefix="/proctoring", tags=["Proctoring"])
settings = get_settings()

_ERR_SESSION_NOT_FOUND = "Session not found"
_ERR_SESSION_NOT_ACTIVE = "Session is not active"


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

    response_violations: list[DetectedViolation] = []
    violations_persisted = False

    if payload.session_id:
        session = SessionService(db).get_by_id(payload.session_id)
        if session and session.status.value == "active":
            frame_bgr = _decode_frame_to_bgr(payload.frame_base64)
            student_id = payload.student_id or session.student_id
            persisted = persist_frame_analysis(
                db,
                payload.session_id,
                student_id,
                frame_bytes,
                frame_bgr,
                result,
            )
            response_violations = [
                DetectedViolation(
                    violation_type=v.violation_type,
                    confidence=v.confidence,
                    description=v.description,
                )
                for v in persisted
            ]
            violations_persisted = len(persisted) > 0

    if not response_violations:
        response_violations = [
            DetectedViolation(
                violation_type=v.violation_type,
                confidence=v.confidence,
                description=v.description,
            )
            for v in result.violations
            if v.violation_type.value != "no_person"
        ]

    return FrameAnalysisResponse(
        person_count=result.person_count,
        gaze_yaw=result.gaze_yaw,
        gaze_pitch=result.gaze_pitch,
        violations=response_violations,
        violations_persisted=violations_persisted,
        processing_time_ms=result.processing_time_ms,
    )


# ── Browser event endpoint ────────────────────────────────────────────────────

_BROWSER_EVENT_TYPES = {
    "tab_switch": ViolationType.TAB_SWITCH,
    "window_blur": ViolationType.WINDOW_BLUR,
}

_BROWSER_EVENT_DESCRIPTIONS = {
    "tab_switch": "El estudiante cambió de pestaña del navegador",
    "window_blur": "El estudiante cambió a otra ventana o aplicación",
}


class BrowserEventRequest(BaseModel):
    session_id: str
    event_type: str  # "tab_switch" | "window_blur"


class BrowserEventResponse(BaseModel):
    recorded: bool
    violation_type: str
    message: str


@router.post(
    "/browser-event",
    response_model=BrowserEventResponse,
    summary="Record a browser-side focus/visibility event as a proctoring violation",
)
def report_browser_event(
    payload: BrowserEventRequest,
    db: Session = Depends(get_db),
):
    violation_type = _BROWSER_EVENT_TYPES.get(payload.event_type)
    if violation_type is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown event_type '{payload.event_type}'. Allowed: {list(_BROWSER_EVENT_TYPES)}",
        )

    session = SessionService(db).get_by_id(payload.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_ERR_SESSION_NOT_FOUND)
    if session.status.value != "active":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_ERR_SESSION_NOT_ACTIVE)

    ViolationService(db).record(
        session_id=payload.session_id,
        violation_type=violation_type,
        confidence=1.0,
        frame_snapshot=None,
    )

    return BrowserEventResponse(
        recorded=True,
        violation_type=violation_type.value,
        message=_BROWSER_EVENT_DESCRIPTIONS[payload.event_type],
    )


# ── Identity verification endpoints ──────────────────────────────────────────

_identity_verifier = IdentityVerifier()


class IdentityRequest(BaseModel):
    session_id: str
    frame_base64: str

    @staticmethod
    def _decode(frame_base64: str) -> bytes:
        if "," in frame_base64 and frame_base64.startswith("data:"):
            frame_base64 = frame_base64.split(",", 1)[1]
        return base64.b64decode(frame_base64)


class RegisterIdentityResponse(BaseModel):
    registered: bool
    message: str


class CheckIdentityResponse(BaseModel):
    identity_verified: bool
    similarity: float | None
    violation_recorded: bool
    message: str


def _decode_frame_to_bgr(frame_base64: str):
    import cv2
    import numpy as np

    if "," in frame_base64 and frame_base64.startswith("data:"):
        frame_base64 = frame_base64.split(",", 1)[1]
    frame_bytes = base64.b64decode(frame_base64)
    nparr = np.frombuffer(frame_bytes, np.uint8)
    frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame_bgr is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Could not decode image")
    return frame_bgr


@router.post(
    "/register-identity",
    response_model=RegisterIdentityResponse,
    summary="Capture a reference face embedding for the student at session start",
)
def register_identity(
    payload: IdentityRequest,
    db: Session = Depends(get_db),
):
    session = SessionService(db).get_by_id(payload.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_ERR_SESSION_NOT_FOUND)
    if session.status.value != "active":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_ERR_SESSION_NOT_ACTIVE)

    frame_bgr = _decode_frame_to_bgr(payload.frame_base64)
    embedding = _identity_verifier.extract_embedding(frame_bgr)

    if embedding is None:
        return RegisterIdentityResponse(
            registered=False,
            message="No se detectó ningún rostro. Asegúrate de estar frente a la cámara.",
        )

    session.reference_embedding = json.dumps(embedding)
    db.commit()

    return RegisterIdentityResponse(
        registered=True,
        message="Identidad registrada correctamente.",
    )


@router.post(
    "/check-identity",
    response_model=CheckIdentityResponse,
    summary="Compare current frame against the registered identity; record violation on mismatch",
)
def check_identity(
    payload: IdentityRequest,
    db: Session = Depends(get_db),
):
    session = SessionService(db).get_by_id(payload.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=_ERR_SESSION_NOT_FOUND)
    if session.status.value != "active":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=_ERR_SESSION_NOT_ACTIVE)
    if not session.reference_embedding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No reference identity registered for this session. Call /register-identity first.",
        )

    reference = json.loads(session.reference_embedding)
    frame_bgr = _decode_frame_to_bgr(payload.frame_base64)
    current_embedding = _identity_verifier.extract_embedding(frame_bgr)

    if current_embedding is None:
        return CheckIdentityResponse(
            identity_verified=False,
            similarity=None,
            violation_recorded=False,
            message="No se detectó ningún rostro en el frame actual.",
        )

    is_same, similarity = _identity_verifier.compare(reference, current_embedding)
    violation_recorded = False

    if not is_same:
        frame_bytes = IdentityRequest._decode(payload.frame_base64)
        capture_url = upload_identity_violation_capture(payload.session_id, frame_bytes)
        ViolationService(db).record(
            session_id=payload.session_id,
            violation_type=ViolationType.IDENTITY_MISMATCH,
            confidence=round(1.0 - similarity, 4),
            frame_snapshot=capture_url,
        )
        violation_recorded = True

    return CheckIdentityResponse(
        identity_verified=is_same,
        similarity=round(similarity, 4),
        violation_recorded=violation_recorded,
        message="Identidad verificada." if is_same else "Posible sustitución de persona detectada.",
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
