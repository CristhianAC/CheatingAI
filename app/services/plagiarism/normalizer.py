_PYTHON_KEYWORDS = {
    "def", "class", "return", "if", "else", "elif", "for", "while",
    "import", "from", "as", "with", "try", "except", "finally",
    "raise", "pass", "break", "continue", "lambda", "yield",
    "and", "or", "not", "in", "is", "True", "False", "None",
    "async", "await", "global", "nonlocal", "del",
}

_JAVA_KEYWORDS = {
    "public", "private", "protected", "static", "void", "int",
    "long", "double", "float", "boolean", "char", "byte", "short",
    "class", "interface", "extends", "implements", "new", "return",
    "if", "else", "for", "while", "do", "switch", "case", "break",
    "continue", "try", "catch", "finally", "throw", "throws",
    "import", "package", "this", "super", "final", "abstract",
    "synchronized", "null", "true", "false",
}


def normalize_tokens(tokens: list[tuple[str, str]], language: str) -> list[str]:
    """
    Normaliza los tokens eliminando diferencias superficiales:

    - Identificadores/variables  → VAR_0, VAR_1, ... (consistente por submission)
    - Keywords del lenguaje      → conservados en minúsculas
    - Literales de string        → STR_LIT
    - Literales numéricos        → NUM_LIT
    - Operadores y puntuación    → sin cambios

    Esto hace que dos códigos con variables renombradas produzcan
    la misma secuencia de tokens normalizada.
    """
    keywords = _PYTHON_KEYWORDS if language == "python" else _JAVA_KEYWORDS

    var_map: dict[str, str] = {}
    var_idx = 0
    normalized: list[str] = []

    for ttype_str, value in tokens:
        if "Keyword" in ttype_str:
            normalized.append(value.lower())

        elif "Name" in ttype_str:
            if value in keywords:
                normalized.append(value.lower())
            else:
                if value not in var_map:
                    var_map[value] = f"VAR_{var_idx}"
                    var_idx += 1
                normalized.append(var_map[value])

        elif "Literal.String" in ttype_str or "String" in ttype_str:
            normalized.append("STR_LIT")

        elif "Literal.Number" in ttype_str or "Number" in ttype_str:
            normalized.append("NUM_LIT")

        else:
            # Operadores, puntuación, etc.
            normalized.append(value)

    return normalized
