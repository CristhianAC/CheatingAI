import pytest
from app.services.plagiarism.normalizer import normalize_tokens


class TestNormalizeTokens:
    def test_keywords_preserved_python(self):
        tokens = [("Token.Keyword", "def"), ("Token.Keyword", "return")]
        result = normalize_tokens(tokens, "python")
        assert result == ["def", "return"]

    def test_keywords_preserved_java(self):
        tokens = [("Token.Keyword", "public"), ("Token.Keyword", "static")]
        result = normalize_tokens(tokens, "java")
        assert result == ["public", "static"]

    def test_variables_anonymized_consistently(self):
        tokens = [
            ("Token.Name", "fibonacci"),
            ("Token.Name", "n"),
            ("Token.Name", "fibonacci"),  # misma variable
        ]
        result = normalize_tokens(tokens, "python")
        # La misma variable debe mapear al mismo nombre anónimo
        assert result[0] == result[2]
        # Distintas variables deben ser distintas
        assert result[0] != result[1]

    def test_variables_get_sequential_names(self):
        tokens = [
            ("Token.Name", "foo"),
            ("Token.Name", "bar"),
            ("Token.Name", "baz"),
        ]
        result = normalize_tokens(tokens, "python")
        assert result == ["VAR_0", "VAR_1", "VAR_2"]

    def test_string_literals_normalized(self):
        tokens = [('Token.Literal.String', '"hello"'), ('Token.Literal.String', '"world"')]
        result = normalize_tokens(tokens, "python")
        assert result == ["STR_LIT", "STR_LIT"]

    def test_number_literals_normalized(self):
        tokens = [("Token.Literal.Number.Integer", "42"), ("Token.Literal.Number.Float", "3.14")]
        result = normalize_tokens(tokens, "python")
        assert result == ["NUM_LIT", "NUM_LIT"]

    def test_operators_preserved(self):
        tokens = [("Token.Operator", "+"), ("Token.Operator", "==")]
        result = normalize_tokens(tokens, "python")
        assert result == ["+", "=="]

    def test_punctuation_preserved(self):
        tokens = [("Token.Punctuation", "("), ("Token.Punctuation", ")")]
        result = normalize_tokens(tokens, "python")
        assert result == ["(", ")"]

    def test_python_keyword_in_name_position(self):
        # 'return' es keyword de Python y no debe ser anonimizado
        tokens = [("Token.Name", "return")]
        result = normalize_tokens(tokens, "python")
        assert result == ["return"]

    def test_empty_tokens(self):
        assert normalize_tokens([], "python") == []

    def test_variable_map_resets_per_call(self):
        tokens = [("Token.Name", "x")]
        first = normalize_tokens(tokens, "python")
        second = normalize_tokens(tokens, "python")
        # Cada llamada es independiente
        assert first == second == ["VAR_0"]
