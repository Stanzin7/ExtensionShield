"""
Tests for API user identity extraction helper.

Security regression coverage:
- Identity must come from authenticated request state only.
- X-User-Id header must never be trusted.
"""

from types import SimpleNamespace

from extension_shield.api.auth_identity import get_user_id


def test_get_user_id_prefers_authenticated_state_user_id():
    request = SimpleNamespace(
        state=SimpleNamespace(user_id="real-user-123"),
        headers={"X-User-Id": "attacker-id"},
    )

    assert get_user_id(request) == "real-user-123"


def test_get_user_id_ignores_x_user_id_header_when_not_authenticated():
    request = SimpleNamespace(
        state=SimpleNamespace(user_id=None),
        headers={"X-User-Id": "attacker-id"},
    )

    assert get_user_id(request) == "anon"


def test_get_user_id_returns_anon_without_authenticated_user():
    request = SimpleNamespace(
        state=SimpleNamespace(user_id=None),
        headers={},
    )

    assert get_user_id(request) == "anon"
