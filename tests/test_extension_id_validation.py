"""
Tests for consistent Chrome extension ID validation: ^[a-z]{32}$
"""

import pytest
from extension_shield.utils.extension import (
    is_chrome_extension_id,
    extract_extension_id_by_url,
    CHROME_EXTENSION_ID_PATTERN,
)


def test_valid_extension_id():
    """Valid: exactly 32 lowercase letters."""
    valid_id = "dbepggeogbaibhgnhhndojpepiihcmeb"
    assert is_chrome_extension_id(valid_id) is True
    assert CHROME_EXTENSION_ID_PATTERN.match(valid_id) is not None
    assert extract_extension_id_by_url(
        f"https://chromewebstore.google.com/detail/name/{valid_id}"
    ) == valid_id


def test_invalid_extension_id_wrong_length():
    """Invalid: 31 or 33 chars (wrong length)."""
    assert is_chrome_extension_id("a" * 31) is False
    assert is_chrome_extension_id("a" * 33) is False
    url_31 = "https://chromewebstore.google.com/detail/" + "a" * 31
    assert extract_extension_id_by_url(url_31) is None


def test_invalid_extension_id_wrong_chars():
    """Invalid: digits (must be [a-z] only); uppercase is normalized to lower so still valid."""
    assert is_chrome_extension_id("0" * 32) is False
    assert is_chrome_extension_id("a" * 31 + "1") is False
    assert is_chrome_extension_id("dbepggeogbaibhgnhhndojpepiihcmeb") is True
    url_with_digit = "https://chromewebstore.google.com/detail/name/" + "a" * 31 + "1"
    assert extract_extension_id_by_url(url_with_digit) is None
