"""
Supabase JWT verification (JWKS) for FastAPI.

Design goals:
- Best-effort identity extraction: invalid/missing token => user_id None
- No persistence of tokens, IPs, or PII
- Cache JWKS in-memory with TTL to avoid repeated network calls
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests
from fastapi import Request
from jose import jwk, jwt
from jose.utils import base64url_decode

from extension_shield.core.config import get_settings


@dataclass
class _JwksCache:
    keys: Dict[str, Dict[str, Any]]
    fetched_at: float


_JWKS_CACHE: Optional[_JwksCache] = None
_JWKS_TTL_SECONDS = 60 * 60  # 1 hour


def _fetch_jwks(jwks_url: str) -> Dict[str, Dict[str, Any]]:
    resp = requests.get(jwks_url, timeout=5)
    resp.raise_for_status()
    body = resp.json()
    keys = body.get("keys") or []
    by_kid: Dict[str, Dict[str, Any]] = {}
    for k in keys:
        kid = k.get("kid")
        if kid:
            by_kid[str(kid)] = k
    return by_kid


def _get_jwks_by_kid(jwks_url: str) -> Dict[str, Dict[str, Any]]:
    global _JWKS_CACHE
    now = time.time()
    if _JWKS_CACHE and (now - _JWKS_CACHE.fetched_at) < _JWKS_TTL_SECONDS:
        return _JWKS_CACHE.keys

    keys = _fetch_jwks(jwks_url)
    _JWKS_CACHE = _JwksCache(keys=keys, fetched_at=now)
    return keys


def _get_expected_issuer(supabase_url: str) -> str:
    return f"{supabase_url.rstrip('/')}/auth/v1"


def verify_supabase_access_token(token: str) -> Optional[Dict[str, Any]]:
    settings = get_settings()
    jwks_url = settings.supabase_jwks_url
    aud = settings.supabase_jwt_aud
    supabase_url = settings.supabase_url

    if not jwks_url or not supabase_url:
        return None

    expected_issuer = _get_expected_issuer(supabase_url)

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not kid:
            return None

        jwks_by_kid = _get_jwks_by_kid(jwks_url)
        jwk_data = jwks_by_kid.get(str(kid))

        if not jwk_data:
            global _JWKS_CACHE
            _JWKS_CACHE = None
            jwks_by_kid = _get_jwks_by_kid(jwks_url)
            jwk_data = jwks_by_kid.get(str(kid))
            if not jwk_data:
                return None

        public_key = jwk.construct(jwk_data)

        # ✅ FIX: validate token structure before splitting
        parts = token.split(".")
        if len(parts) != 3:
            return None

        message = ".".join(parts[:2])
        encoded_sig = parts[2]

        decoded_sig = base64url_decode(encoded_sig.encode("utf-8"))
        if not public_key.verify(message.encode("utf-8"), decoded_sig):
            return None

        payload = jwt.decode(
            token,
            public_key.to_pem().decode("utf-8"),
            algorithms=[header.get("alg", "RS256")],
            audience=aud,
            issuer=expected_issuer,
            options={
                "verify_aud": bool(aud),
                "verify_iss": True,
                "verify_exp": True,
            },
        )

        if payload.get("iss") != expected_issuer:
            return None

        if aud:
            token_aud = payload.get("aud")
            if isinstance(token_aud, list):
                if aud not in token_aud:
                    return None
            elif isinstance(token_aud, str):
                if token_aud != aud:
                    return None
            else:
                return None

        return payload

    except Exception:
        return None


def get_current_user_id(request: Request) -> Optional[str]:
    authz = request.headers.get("authorization") or request.headers.get("Authorization")
    if not authz:
        return None

    parts = authz.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    payload = verify_supabase_access_token(parts[1])
    if not payload:
        return None

    sub = payload.get("sub")
    return str(sub) if sub else None