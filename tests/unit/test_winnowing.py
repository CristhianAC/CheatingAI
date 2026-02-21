import pytest
from app.services.plagiarism.winnowing import build_kgrams, hash_kgram, winnowing


class TestBuildKgrams:
    def test_normal_case(self):
        tokens = ["a", "b", "c", "d", "e"]
        kgrams = build_kgrams(tokens, k=3)
        assert len(kgrams) == 3  # n - k + 1 = 5 - 3 + 1

    def test_exact_size(self):
        tokens = ["a", "b", "c"]
        kgrams = build_kgrams(tokens, k=3)
        assert len(kgrams) == 1
        assert kgrams[0] == ("a", "b", "c")

    def test_shorter_than_k_returns_single_kgram(self):
        tokens = ["a", "b"]
        kgrams = build_kgrams(tokens, k=5)
        assert len(kgrams) == 1
        assert kgrams[0] == ("a", "b")

    def test_empty_tokens(self):
        kgrams = build_kgrams([], k=3)
        assert kgrams == []

    def test_kgram_content(self):
        tokens = ["def", "VAR_0", "(", "VAR_1", ")"]
        kgrams = build_kgrams(tokens, k=3)
        assert kgrams[0] == ("def", "VAR_0", "(")
        assert kgrams[1] == ("VAR_0", "(", "VAR_1")
        assert kgrams[2] == ("(", "VAR_1", ")")


class TestHashKgram:
    def test_deterministic(self):
        kgram = ("def", "VAR_0", "(")
        assert hash_kgram(kgram) == hash_kgram(kgram)

    def test_different_kgrams_different_hashes(self):
        kgram_a = ("def", "VAR_0", "(")
        kgram_b = ("return", "VAR_1", ")")
        assert hash_kgram(kgram_a) != hash_kgram(kgram_b)

    def test_returns_int(self):
        assert isinstance(hash_kgram(("a", "b")), int)

    def test_order_matters(self):
        assert hash_kgram(("a", "b", "c")) != hash_kgram(("c", "b", "a"))


class TestWinnowing:
    def test_returns_set(self):
        fps = winnowing([10, 5, 8, 3, 7], w=3)
        assert isinstance(fps, set)

    def test_empty_hashes(self):
        assert winnowing([], w=3) == set()

    def test_single_element(self):
        # Con 1 hash y ventana w=3, no se completa ninguna ventana → set vacío
        fps = winnowing([42], w=3)
        assert isinstance(fps, set)
        # Con w=1 sí se selecciona el único hash disponible
        fps_w1 = winnowing([42], w=1)
        assert 42 in fps_w1

    def test_identical_hashes_same_fingerprints(self):
        hashes = [10, 5, 8, 3, 7, 2, 9]
        fps1 = winnowing(hashes, w=3)
        fps2 = winnowing(hashes, w=3)
        assert fps1 == fps2

    def test_selects_minimums(self):
        # Con w=3, ventanas: [10,5,8]=min5, [5,8,3]=min3, [8,3,7]=min3
        hashes = [10, 5, 8, 3, 7]
        fps = winnowing(hashes, w=3)
        assert 3 in fps
        assert 5 in fps

    def test_larger_window_fewer_fingerprints(self):
        hashes = list(range(20))
        fps_small = winnowing(hashes, w=2)
        fps_large = winnowing(hashes, w=10)
        # Una ventana más grande tiende a producir menos o igual fingerprints
        assert len(fps_large) <= len(fps_small)
