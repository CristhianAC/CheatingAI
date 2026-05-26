"""Tests de umbrales, cooldown y capturas en frame_persistence."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.models.violation import ViolationType
from app.services import frame_persistence as fp
from app.services.vision.detector import AnalysisResult, ViolationDetected


@pytest.fixture(autouse=True)
def _clear_cooldown():
    fp.reset_cooldown_state()
    yield
    fp.reset_cooldown_state()


def _looking_away(confidence: float) -> ViolationDetected:
    return ViolationDetected(
        violation_type=ViolationType.LOOKING_AWAY,
        confidence=confidence,
        description="Mirando a la derecha",
    )


def test_gaze_requires_consecutive_frames_before_persist():
    db = MagicMock()
    result = AnalysisResult(person_count=1, gaze_yaw=0.2, gaze_pitch=0.0, violations=[_looking_away(0.92)])

    with patch.object(fp, "compare_frame_to_profile", return_value=(None, None)):
        with patch.object(fp.ViolationService, "record") as record:
            out = fp.persist_frame_analysis(db, "sess-1", "stu-1", b"frame", MagicMock(), result)

    assert out == []
    record.assert_not_called()


def test_skips_looking_away_below_persist_threshold():
    db = MagicMock()
    result = AnalysisResult(person_count=1, gaze_yaw=0.2, gaze_pitch=0.0, violations=[_looking_away(0.80)])

    with patch.object(fp, "compare_frame_to_profile", return_value=(None, None)):
        with patch.object(fp.ViolationService, "record") as record:
            out = fp.persist_frame_analysis(db, "sess-1", "stu-1", b"frame", MagicMock(), result)

    assert out == []
    record.assert_not_called()


def test_persists_looking_away_with_snapshot_when_high_confidence():
    db = MagicMock()
    result = AnalysisResult(person_count=1, gaze_yaw=0.2, gaze_pitch=0.0, violations=[_looking_away(0.92)])
    fake_url = "https://example.com/cap.jpg"

    with patch.object(fp, "compare_frame_to_profile", return_value=(None, None)):
        with patch.object(fp, "upload_violation_evidence_capture", return_value=fake_url) as upload:
            with patch.object(fp.ViolationService, "record") as record:
                # Gaze gate: requires 2 consecutive frames with looking_away
                fp.persist_frame_analysis(db, "sess-1", "stu-1", b"frame", MagicMock(), result)
                out = fp.persist_frame_analysis(db, "sess-1", "stu-1", b"frame", MagicMock(), result)

    assert len(out) == 1
    upload.assert_called_once()
    record.assert_called_once()
    assert record.call_args.kwargs["frame_snapshot"] == fake_url


def test_cooldown_blocks_duplicate_within_window():
    db = MagicMock()
    result = AnalysisResult(person_count=1, gaze_yaw=0.2, gaze_pitch=0.0, violations=[_looking_away(0.92)])

    with patch.object(fp, "compare_frame_to_profile", return_value=(None, None)):
        with patch.object(fp, "upload_violation_evidence_capture", return_value="https://x/y.jpg"):
            with patch.object(fp.ViolationService, "record") as record:
                fp.persist_frame_analysis(db, "sess-1", "stu-1", b"frame", MagicMock(), result)
                fp.persist_frame_analysis(db, "sess-1", "stu-1", b"frame", MagicMock(), result)
                fp.persist_frame_analysis(db, "sess-1", "stu-1", b"frame", MagicMock(), result)

    assert record.call_count == 1


def test_cooldown_allows_higher_confidence_bump():
    db = MagicMock()
    v1 = _looking_away(0.91)
    v2 = _looking_away(0.97)
    base = dict(person_count=1, gaze_yaw=0.2, gaze_pitch=0.0)

    with patch.object(fp, "compare_frame_to_profile", return_value=(None, None)):
        with patch.object(fp, "upload_violation_evidence_capture", return_value="https://x/y.jpg"):
            with patch.object(fp.ViolationService, "record") as record:
                fp.persist_frame_analysis(
                    db, "sess-1", "stu-1", b"f", MagicMock(), AnalysisResult(**base, violations=[v1])
                )
                fp.persist_frame_analysis(
                    db, "sess-1", "stu-1", b"f", MagicMock(), AnalysisResult(**base, violations=[v1])
                )
                fp.persist_frame_analysis(
                    db, "sess-1", "stu-1", b"f", MagicMock(), AnalysisResult(**base, violations=[v2])
                )
                fp.persist_frame_analysis(
                    db, "sess-1", "stu-1", b"f", MagicMock(), AnalysisResult(**base, violations=[v2])
                )

    assert record.call_count == 2
