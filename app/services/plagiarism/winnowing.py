import hashlib
from collections import deque


def build_kgrams(tokens: list[str], k: int) -> list[tuple[str, ...]]:
    """
    Construye k-grams (subsecuencias de k tokens consecutivos).

    Si el código es más corto que k, retorna un único k-gram con todos los tokens.
    """
    if len(tokens) < k:
        return [tuple(tokens)] if tokens else []
    return [tuple(tokens[i : i + k]) for i in range(len(tokens) - k + 1)]


def hash_kgram(kgram: tuple[str, ...]) -> int:
    """
    Hash determinista de un k-gram usando SHA256 truncado a 32 bits.
    """
    text = " ".join(kgram).encode("utf-8")
    digest = hashlib.sha256(text).digest()
    return int.from_bytes(digest[:4], byteorder="big")


def winnowing(hashes: list[int], w: int) -> set[int]:
    """
    Algoritmo Winnowing: selecciona fingerprints con ventana deslizante de tamaño w.

    Invariante: de cada ventana de w hashes consecutivos se selecciona
    el hash mínimo. Si hay empate se toma el más a la derecha.

    Garantía: detecta cualquier subcadena común de longitud >= k + w - 1 tokens.

    Retorna el conjunto de fingerprints (hashes seleccionados).
    """
    if not hashes:
        return set()

    fingerprints: set[int] = set()
    window: deque[tuple[int, int]] = deque()  # (hash_value, index)

    for i, h in enumerate(hashes):
        # Agregar nuevo elemento
        window.append((h, i))

        # Eliminar elementos fuera de la ventana actual
        while window and window[0][1] <= i - w:
            window.popleft()

        # Cuando tenemos al menos una ventana completa, registrar el mínimo
        if i >= w - 1:
            min_hash = min(window, key=lambda x: x[0])[0]
            fingerprints.add(min_hash)

    return fingerprints
