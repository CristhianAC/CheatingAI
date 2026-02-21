import pytest


class TestCreateSubmission:
    def test_success_python(self, client, python_code_fib_a):
        resp = client.post("/api/v1/submissions/", json={
            "student_id": "est-001",
            "problem_id": "prob-fib",
            "language": "python",
            "source_code": python_code_fib_a,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["student_id"] == "est-001"
        assert data["language"] == "python"
        assert "id" in data
        assert "code_hash" in data
        # source_code NO debe exponerse en la respuesta
        assert "source_code" not in data

    def test_success_java(self, client, java_code_fib):
        resp = client.post("/api/v1/submissions/", json={
            "student_id": "est-002",
            "problem_id": "prob-fib",
            "language": "java",
            "source_code": java_code_fib,
        })
        assert resp.status_code == 201
        assert resp.json()["language"] == "java"

    def test_success_with_exam_id(self, client, python_code_fib_a):
        resp = client.post("/api/v1/submissions/", json={
            "student_id": "est-001",
            "problem_id": "prob-fib",
            "exam_id": "parcial-1",
            "language": "python",
            "source_code": python_code_fib_a,
        })
        assert resp.status_code == 201
        assert resp.json()["exam_id"] == "parcial-1"

    def test_invalid_language(self, client):
        resp = client.post("/api/v1/submissions/", json={
            "student_id": "est-001",
            "problem_id": "prob-fib",
            "language": "javascript",
            "source_code": "console.log('hello')",
        })
        assert resp.status_code == 422

    def test_empty_source_code(self, client):
        resp = client.post("/api/v1/submissions/", json={
            "student_id": "est-001",
            "problem_id": "prob-fib",
            "language": "python",
            "source_code": "   ",
        })
        assert resp.status_code == 422

    def test_missing_required_fields(self, client):
        resp = client.post("/api/v1/submissions/", json={"student_id": "est-001"})
        assert resp.status_code == 422


class TestGetSubmission:
    def test_get_existing(self, client, python_code_fib_a):
        created = client.post("/api/v1/submissions/", json={
            "student_id": "est-001", "problem_id": "prob-fib",
            "language": "python", "source_code": python_code_fib_a,
        }).json()

        resp = client.get(f"/api/v1/submissions/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_get_nonexistent(self, client):
        resp = client.get("/api/v1/submissions/does-not-exist")
        assert resp.status_code == 404


class TestListSubmissions:
    def test_list_all(self, client, python_code_fib_a, python_code_fib_b):
        client.post("/api/v1/submissions/", json={
            "student_id": "est-a", "problem_id": "prob-sort",
            "language": "python", "source_code": python_code_fib_a,
        })
        client.post("/api/v1/submissions/", json={
            "student_id": "est-b", "problem_id": "prob-sort",
            "language": "python", "source_code": python_code_fib_b,
        })

        resp = client.get("/api/v1/submissions/")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "items" in data
        assert data["total"] >= 2

    def test_filter_by_problem_id(self, client, python_code_fib_a):
        for i in range(3):
            client.post("/api/v1/submissions/", json={
                "student_id": f"est-{i}", "problem_id": "unique-prob",
                "language": "python", "source_code": f"# version {i}\n" + python_code_fib_a,
            })

        resp = client.get("/api/v1/submissions/?problem_id=unique-prob")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert all(s["problem_id"] == "unique-prob" for s in data["items"])

    def test_filter_by_language(self, client, python_code_fib_a, java_code_fib):
        client.post("/api/v1/submissions/", json={
            "student_id": "est-py", "problem_id": "mixed-prob",
            "language": "python", "source_code": python_code_fib_a,
        })
        client.post("/api/v1/submissions/", json={
            "student_id": "est-java", "problem_id": "mixed-prob",
            "language": "java", "source_code": java_code_fib,
        })

        resp = client.get("/api/v1/submissions/?problem_id=mixed-prob&language=python")
        assert resp.status_code == 200
        data = resp.json()
        assert all(s["language"] == "python" for s in data["items"])


class TestUpdateSubmission:
    def test_update_exam_id(self, client, python_code_fib_a):
        created = client.post("/api/v1/submissions/", json={
            "student_id": "est-001", "problem_id": "prob-fib",
            "language": "python", "source_code": python_code_fib_a,
        }).json()

        resp = client.put(f"/api/v1/submissions/{created['id']}", json={"exam_id": "parcial-2"})
        assert resp.status_code == 200
        assert resp.json()["exam_id"] == "parcial-2"

    def test_update_nonexistent(self, client):
        resp = client.put("/api/v1/submissions/does-not-exist", json={"exam_id": "p1"})
        assert resp.status_code == 404


class TestDeleteSubmission:
    def test_delete_existing(self, client, python_code_fib_a):
        created = client.post("/api/v1/submissions/", json={
            "student_id": "est-del", "problem_id": "prob-del",
            "language": "python", "source_code": python_code_fib_a,
        }).json()

        resp = client.delete(f"/api/v1/submissions/{created['id']}")
        assert resp.status_code == 204

        resp = client.get(f"/api/v1/submissions/{created['id']}")
        assert resp.status_code == 404

    def test_delete_nonexistent(self, client):
        resp = client.delete("/api/v1/submissions/does-not-exist")
        assert resp.status_code == 404
