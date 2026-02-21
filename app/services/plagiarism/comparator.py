from dataclasses import dataclass

from app.models.submission import Language
from app.services.plagiarism.normalizer import normalize_tokens
from app.services.plagiarism.tokenizer import tokenize
from app.services.plagiarism.winnowing import build_kgrams, hash_kgram, winnowing

DEFAULT_K = 5
DEFAULT_W = 4


@dataclass
class PlagiarismResult:
    similarity_score: float
    is_exact_copy: bool
    algorithm_details: dict


def compute_fingerprints(
    source_code: str,
    language: Language,
    k: int = DEFAULT_K,
    w: int = DEFAULT_W,
) -> set[int]:
    """
    Pipeline completo: source_code → fingerprints Winnowing.

    1. Tokenizar con Pygments
    2. Normalizar (variables anónimas, literales)
    3. Construir k-grams
    4. Hashear cada k-gram
    5. Aplicar Winnowing
    """
    raw_tokens = tokenize(source_code, language)
    norm_tokens = normalize_tokens(raw_tokens, language.value)
    kgrams = build_kgrams(norm_tokens, k)
    hashes = [hash_kgram(kg) for kg in kgrams]
    return winnowing(hashes, w)


def compare_submissions(
    code_a: str,
    code_b: str,
    hash_a: str,
    hash_b: str,
    language: Language,
    k: int = DEFAULT_K,
    w: int = DEFAULT_W,
) -> PlagiarismResult:
    """
    Compara dos submissions y retorna el score de similitud Jaccard [0.0, 1.0].

    Primero verifica copias exactas por hash SHA256 (O(1)).
    Si no son idénticas, ejecuta el pipeline Winnowing completo.

    Jaccard(A, B) = |A ∩ B| / |A ∪ B|
    """
    if hash_a == hash_b:
        return PlagiarismResult(
            similarity_score=1.0,
            is_exact_copy=True,
            algorithm_details={
                "fingerprints_a": 0,
                "fingerprints_b": 0,
                "common_fingerprints": 0,
                "k": k,
                "w": w,
            },
        )

    fp_a = compute_fingerprints(code_a, language, k, w)
    fp_b = compute_fingerprints(code_b, language, k, w)

    intersection = fp_a & fp_b
    union = fp_a | fp_b

    score = round(len(intersection) / len(union), 4) if union else 0.0

    return PlagiarismResult(
        similarity_score=score,
        is_exact_copy=False,
        algorithm_details={
            "fingerprints_a": len(fp_a),
            "fingerprints_b": len(fp_b),
            "common_fingerprints": len(intersection),
            "k": k,
            "w": w,
        },
    )
