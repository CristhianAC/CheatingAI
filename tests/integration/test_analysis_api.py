import pytest
from unittest.mock import patch, MagicMock


def _create_submission(client, student_id, problem_id, language, source_code, exam_id=None):
    payload = {
        "student_id": student_id,
        "problem_id": problem_id,
        "language": language,
        "source_code": source_code,
    }
    if exam_id:
        payload["exam_id"] = exam_id
    return client.post("/api/v1/submissions/", json=payload).json()


class TestPairwiseAnalysis:
    def test_success(self, client, python_code_fib_a, python_code_fib_b):
        sub_a = _create_submission(client, "est-a", "prob-p", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-p", "python", python_code_fib_b)

        resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.7,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "similarity_score" in data
        assert 0.0 <= data["similarity_score"] <= 1.0
        assert "is_flagged" in data
        assert "is_exact_copy" in data
        assert "algorithm_details" in data

    def test_same_id_rejected(self, client, python_code_fib_a):
        sub = _create_submission(client, "est-a", "prob-p", "python", python_code_fib_a)
        resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub["id"],
            "submission_b_id": sub["id"],
            "threshold": 0.7,
        })
        assert resp.status_code == 422

    def test_nonexistent_submission(self, client, python_code_fib_a):
        sub = _create_submission(client, "est-a", "prob-p", "python", python_code_fib_a)
        resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub["id"],
            "submission_b_id": "non-existent-id",
            "threshold": 0.7,
        })
        assert resp.status_code == 404

    def test_different_languages_rejected(self, client, python_code_fib_a, java_code_fib):
        sub_py = _create_submission(client, "est-a", "prob-p", "python", python_code_fib_a)
        sub_java = _create_submission(client, "est-b", "prob-p", "java", java_code_fib)

        resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_py["id"],
            "submission_b_id": sub_java["id"],
            "threshold": 0.7,
        })
        assert resp.status_code == 400

    def test_exact_copy_detected(self, client, python_code_fib_a):
        sub_a = _create_submission(client, "est-a", "prob-exact", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-exact", "python", python_code_fib_a)

        resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.7,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["similarity_score"] == 1.0
        assert data["is_exact_copy"] is True
        assert data["is_flagged"] is True

    def test_flagged_when_above_threshold(self, client, python_code_fib_a, python_code_fib_b):
        sub_a = _create_submission(client, "est-a", "prob-flag", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-flag", "python", python_code_fib_b)

        # Threshold muy bajo: debe marcar como plagio
        resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.01,
        })
        assert resp.status_code == 200
        assert resp.json()["is_flagged"] is True

    def test_not_flagged_when_below_threshold(self, client, python_code_fib_a, python_code_different):
        sub_a = _create_submission(client, "est-a", "prob-noflag", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-noflag", "python", python_code_different)

        # Threshold muy alto: no debe marcar como plagio
        resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.99,
        })
        assert resp.status_code == 200
        assert resp.json()["is_flagged"] is False


class TestBatchAnalysis:
    def test_batch_requires_scope(self, client):
        resp = client.post("/api/v1/analysis/batch", json={"threshold": 0.7})
        assert resp.status_code == 422

    def test_batch_insufficient_submissions(self, client, python_code_fib_a):
        # Solo 1 submission → error
        _create_submission(client, "est-only", "prob-solo", "python", python_code_fib_a)

        resp = client.post("/api/v1/analysis/batch", json={
            "problem_id": "prob-solo",
            "threshold": 0.7,
        })
        assert resp.status_code == 400

    def test_batch_returns_202_and_job(self, client, python_code_fib_a, python_code_fib_b):
        """El análisis batch debe encolar la tarea y retornar 202 con job_id."""
        _create_submission(client, "est-a", "prob-batch", "python", python_code_fib_a)
        _create_submission(client, "est-b", "prob-batch", "python", python_code_fib_b)

        mock_task = MagicMock()
        mock_task.id = "mock-celery-task-id"

        with patch("app.tasks.plagiarism_tasks.run_batch_analysis") as mock_run:
            mock_run.apply_async.return_value = mock_task

            resp = client.post("/api/v1/analysis/batch", json={
                "problem_id": "prob-batch",
                "threshold": 0.7,
            })

        assert resp.status_code == 202
        data = resp.json()
        assert "id" in data
        assert data["job_type"] == "batch"
        assert data["status"] == "pending"
        assert data["problem_id"] == "prob-batch"
