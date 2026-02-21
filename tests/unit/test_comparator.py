import hashlib
import pytest
from app.models.submission import Language
from app.services.plagiarism.comparator import compare_submissions, compute_fingerprints


def _hash(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


class TestComputeFingerprints:
    def test_returns_set(self, python_code_fib_a):
        fps = compute_fingerprints(python_code_fib_a, Language.PYTHON)
        assert isinstance(fps, set)

    def test_deterministic(self, python_code_fib_a):
        fps1 = compute_fingerprints(python_code_fib_a, Language.PYTHON)
        fps2 = compute_fingerprints(python_code_fib_a, Language.PYTHON)
        assert fps1 == fps2

    def test_nonempty_for_valid_code(self, python_code_fib_a):
        fps = compute_fingerprints(python_code_fib_a, Language.PYTHON)
        assert len(fps) > 0

    def test_java_code(self, java_code_fib):
        fps = compute_fingerprints(java_code_fib, Language.JAVA)
        assert isinstance(fps, set)
        assert len(fps) > 0


class TestCompareSubmissions:
    def test_exact_copy_detected_by_hash(self, python_code_fib_a):
        h = _hash(python_code_fib_a)
        result = compare_submissions(python_code_fib_a, python_code_fib_a, h, h, Language.PYTHON)
        assert result.similarity_score == 1.0
        assert result.is_exact_copy is True

    def test_similar_code_high_score(self, python_code_fib_a, python_code_fib_b):
        result = compare_submissions(
            python_code_fib_a, python_code_fib_b,
            _hash(python_code_fib_a), _hash(python_code_fib_b),
            Language.PYTHON,
        )
        # Código casi idéntico con variables renombradas → score alto
        assert result.similarity_score >= 0.6
        assert result.is_exact_copy is False

    def test_different_code_low_score(self, python_code_fib_a, python_code_different):
        result = compare_submissions(
            python_code_fib_a, python_code_different,
            _hash(python_code_fib_a), _hash(python_code_different),
            Language.PYTHON,
        )
        assert result.similarity_score < 0.5

    def test_score_in_valid_range(self, python_code_fib_a, python_code_fib_b):
        result = compare_submissions(
            python_code_fib_a, python_code_fib_b,
            _hash(python_code_fib_a), _hash(python_code_fib_b),
            Language.PYTHON,
        )
        assert 0.0 <= result.similarity_score <= 1.0

    def test_algorithm_details_structure(self, python_code_fib_a, python_code_fib_b):
        result = compare_submissions(
            python_code_fib_a, python_code_fib_b,
            _hash(python_code_fib_a), _hash(python_code_fib_b),
            Language.PYTHON,
        )
        details = result.algorithm_details
        assert "fingerprints_a" in details
        assert "fingerprints_b" in details
        assert "common_fingerprints" in details
        assert "k" in details
        assert "w" in details

    def test_exact_copy_algorithm_details(self, python_code_fib_a):
        h = _hash(python_code_fib_a)
        result = compare_submissions(python_code_fib_a, python_code_fib_a, h, h, Language.PYTHON)
        # Copia exacta detectada por hash, no corre Winnowing
        assert result.algorithm_details["fingerprints_a"] == 0

    def test_symmetry(self, python_code_fib_a, python_code_fib_b):
        """La similitud A,B debe ser igual a B,A."""
        r1 = compare_submissions(
            python_code_fib_a, python_code_fib_b,
            _hash(python_code_fib_a), _hash(python_code_fib_b),
            Language.PYTHON,
        )
        r2 = compare_submissions(
            python_code_fib_b, python_code_fib_a,
            _hash(python_code_fib_b), _hash(python_code_fib_a),
            Language.PYTHON,
        )
        assert r1.similarity_score == r2.similarity_score
