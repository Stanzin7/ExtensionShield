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
