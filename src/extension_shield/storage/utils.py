"""
Utility functions for storage modules.
"""

import re

def _generate_slug(name: str) -> str:
    """Generate a URL-friendly slug from extension name. Must match frontend slug.js."""
    if not name:
        return ""
    slug = name.lower()
    slug = re.sub(r"[-–—_/\\|]+", "-", slug)
    slug = re.sub(r"[^a-z0-9\s-]", "", slug)
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    slug = slug.strip("-")
    return slug

def _is_extension_id(s: str) -> bool:
    """Check if string is a Chrome extension ID (32 lowercase letters a-p)."""
    return bool(s and len(s) == 32 and all(c in "abcdefghijklmnop" for c in s))

def _relevance_rank(extension_name: str, extension_id: str, search_term: str) -> int:
    """Return a numeric rank for search relevance (lower = better). Used for Supabase in-memory sort."""
    if not search_term or not (extension_name or extension_id):
        return 4
    term = search_term.strip().lower()
    name = (extension_name or "").strip().lower()
    eid = (extension_id or "").lower()
    if name == term:
        return 0  # Exact title match
    if name.startswith(term):
        return 1  # Title starts with search
    if term in name:
        return 2  # Title contains (e.g. "block" in "Paypal ad blocker")
    if term in eid:
        return 3  # ID contains
    return 4

def _escape_postgrest_like_term(term: str) -> str:
    """Escape wildcard characters before interpolating into a PostgREST ilike filter."""
    return re.sub(r"([%_\\])", r"\\\1", term)
