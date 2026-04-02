"""
Tests for API user identity extraction helper.

Security regression coverage:
- Identity must come from authenticated request state only.
- X-User-Id header must never be trusted.
"""

from types import SimpleNamespace

from extension_shield.api.auth_identity import can_view_private_scan, get_user_id


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


def test_can_view_private_scan_allows_public_results():
    result = {"visibility": "public", "user_id": "owner-123"}

    assert can_view_private_scan(None, result)
    assert can_view_private_scan("any-user", result)


def test_can_view_private_scan_blocks_non_owner_for_private_result():
    result = {"visibility": "private", "user_id": "owner-123"}

    assert not can_view_private_scan(None, result)
    assert not can_view_private_scan("other-user", result)


def test_can_view_private_scan_allows_owner_for_private_result():
    result = {"visibility": "private", "user_id": "owner-123"}

    assert can_view_private_scan("owner-123", result)
