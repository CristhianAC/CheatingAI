"""Alineación ViolationType con enum Postgres `violationtype`."""

from app.models.violation import ViolationType


def test_violation_type_values_are_postgres_labels():
    assert ViolationType.LOOKING_AWAY.value == "LOOKING_AWAY"
    assert ViolationType.TAB_SWITCH.value == "TAB_SWITCH"
    assert ViolationType.WINDOW_BLUR.value == "WINDOW_BLUR"
    assert ViolationType.IDENTITY_MISMATCH.value == "IDENTITY_MISMATCH"


def test_client_key_is_snake_case_for_ui_and_storage_paths():
    assert ViolationType.LOOKING_AWAY.client_key == "looking_away"
    assert ViolationType.TAB_SWITCH.client_key == "tab_switch"
