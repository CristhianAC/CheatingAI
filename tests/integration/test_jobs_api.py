import pytest
from unittest.mock import patch, MagicMock


def _create_submission(client, student_id, problem_id, language, source_code):
    return client.post("/api/v1/submissions/", json={
        "student_id": student_id,
        "problem_id": problem_id,
        "language": language,
        "source_code": source_code,
    }).json()


class TestGetJobStatus:
    def test_nonexistent_job(self, client):
        resp = client.get("/api/v1/jobs/does-not-exist")
        assert resp.status_code == 404

    def test_pairwise_job_status(self, client, python_code_fib_a, python_code_fib_b):
        """Un análisis pairwise crea un job COMPLETED inmediatamente."""
        sub_a = _create_submission(client, "est-a", "prob-j", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-j", "python", python_code_fib_b)

        analysis_resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.7,
        }).json()

        job_id = analysis_resp["job_id"]
        resp = client.get(f"/api/v1/jobs/{job_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["job_id"] == job_id
        assert data["status"] == "completed"
        assert data["progress_percent"] == 100.0
        assert "message" in data


class TestGetJobResults:
    def test_results_for_completed_pairwise_job(self, client, python_code_fib_a, python_code_fib_b):
        sub_a = _create_submission(client, "est-a", "prob-r", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-r", "python", python_code_fib_b)

        analysis_resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.7,
        }).json()

        job_id = analysis_resp["job_id"]
        resp = client.get(f"/api/v1/jobs/{job_id}/results")
        assert resp.status_code == 200
        data = resp.json()
        assert data["job_id"] == job_id
        assert data["status"] == "completed"
        assert "total_comparisons" in data
        assert "flagged_count" in data
        assert "results" in data
        assert len(data["results"]) == 1

    def test_results_nonexistent_job(self, client):
        resp = client.get("/api/v1/jobs/does-not-exist/results")
        assert resp.status_code == 404

    def test_flagged_only_filter(self, client, python_code_fib_a, python_code_fib_b):
        sub_a = _create_submission(client, "est-a", "prob-fl", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-fl", "python", python_code_fib_b)

        analysis_resp = client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.01,  # threshold muy bajo → flagged
        }).json()

        job_id = analysis_resp["job_id"]
        resp = client.get(f"/api/v1/jobs/{job_id}/results?flagged_only=true")
        assert resp.status_code == 200
        data = resp.json()
        assert all(r["is_flagged"] for r in data["results"])


class TestListJobs:
    def test_list_jobs(self, client, python_code_fib_a, python_code_fib_b):
        sub_a = _create_submission(client, "est-a", "prob-list", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-list", "python", python_code_fib_b)

        # Crear un job vía pairwise
        client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.7,
        })

        resp = client.get("/api/v1/jobs/")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) >= 1

    def test_list_jobs_filter_by_status(self, client, python_code_fib_a, python_code_fib_b):
        sub_a = _create_submission(client, "est-a", "prob-st", "python", python_code_fib_a)
        sub_b = _create_submission(client, "est-b", "prob-st", "python", python_code_fib_b)

        client.post("/api/v1/analysis/pairwise", json={
            "submission_a_id": sub_a["id"],
            "submission_b_id": sub_b["id"],
            "threshold": 0.7,
        })

        resp = client.get("/api/v1/jobs/?status=completed")
        assert resp.status_code == 200
        data = resp.json()
        assert all(j["status"] == "completed" for j in data)
