from pygments.lexers import JavaLexer, PythonLexer
from pygments.token import Token

from app.models.submission import Language

_LEXERS = {
    Language.PYTHON: PythonLexer(),
    Language.JAVA: JavaLexer(),
}

# Prefijos de tipos de token que se conservan en el análisis
_RELEVANT_PREFIXES = (
    "Token.Keyword",
    "Token.Name",
    "Token.Operator",
    "Token.Punctuation",
    "Token.Literal",
)


def tokenize(source_code: str, language: Language) -> list[tuple[str, str]]:
    """
    Tokeniza el código fuente filtrando comentarios, whitespace y newlines.

    Retorna lista de (tipo_token_str, valor) con solo tokens semánticamente
    relevantes para el análisis de similitud.
    """
    lexer = _LEXERS[language]
    tokens: list[tuple[str, str]] = []

    for ttype, value in lexer.get_tokens(source_code):
        ttype_str = str(ttype)

        # Descartar comentarios y whitespace
        if ttype in Token.Comment or ttype in Token.Text or ttype is Token.Text.Whitespace:
            continue
        if value.strip() == "":
            continue

        # Conservar solo tipos semánticamente relevantes
        if any(ttype_str.startswith(prefix) for prefix in _RELEVANT_PREFIXES):
            tokens.append((ttype_str, value.strip()))

    return tokens
