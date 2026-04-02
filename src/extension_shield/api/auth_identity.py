"""
Authentication identity helpers for API routes.

These helpers intentionally avoid importing heavy runtime dependencies so they
can be tested in isolation.
"""

from typing import Any


def get_user_id(request: Any) -> str:
    """
    Best-effort user identifier.

    Use only Supabase-authenticated user_id (JWT `sub`) from request state.
    Never trust user-controlled headers for identity.
    """
    state_user = getattr(getattr(request, "state", None), "user_id", None)
    if state_user:
        return str(state_user)

    return "anon"


def can_view_private_scan(request_user_id: Any, scan_result: Any) -> bool:
    """
    Return whether the requester may view a scan result that may be private.

    Public scan results remain visible to everyone. Private scan results require
    the authenticated request user_id to match the stored owner user_id.
    """
    if not isinstance(scan_result, dict):
        return False

    if scan_result.get("visibility") != "private":
        return True

    owner_user_id = scan_result.get("user_id")
    if not owner_user_id or not request_user_id:
        return False

    return str(owner_user_id) == str(request_user_id)
