"""
Chrome Extension Utilities

This module provides utilities for extracting, analyzing, and managing Chrome extensions.
"""

import zipfile
import tempfile
import os
import re
import logging
import hashlib
from typing import Optional

from extension_shield.core.config import get_settings

logger = logging.getLogger(__name__)

# Single source of truth: Chrome extension IDs are exactly 32 lowercase letters [a-z]
CHROME_EXTENSION_ID_PATTERN = re.compile(r"^[a-z]{32}$")


def _check_zip_bomb_limits(zip_ref: zipfile.ZipFile, max_files: int, max_uncompressed_bytes: int) -> None:
    """
    Reject archive before extraction if it exceeds zip-bomb limits.
    Raises ValueError if file count or total uncompressed size is over limit.
    """
    file_count = 0
    total_uncompressed = 0
    for member in zip_ref.infolist():
        if member.is_dir():
            continue
        file_count += 1
        if file_count > max_files:
            raise ValueError(
                f"Zip file count ({file_count}) exceeds limit ({max_files}). "
                "Refusing to extract (zip-bomb protection)."
            )
        # file_size is uncompressed size; may be -1 for unknown in some zips
        size = getattr(member, "file_size", 0) or 0
        if size < 0:
            size = 0
        total_uncompressed += size
        if total_uncompressed > max_uncompressed_bytes:
            raise ValueError(
                f"Zip total uncompressed size ({total_uncompressed}) exceeds limit ({max_uncompressed_bytes}). "
                "Refusing to extract (zip-bomb protection)."
            )


def extract_extension_id_by_url(url):
    """Extract extension ID from Chrome Web Store URL. Returns only if it matches ^[a-z]{32}$."""
    try:
        if not url or not isinstance(url, str):
            return None
        candidate = None
        # Handle different URL formats
        if "/detail/" in url:
            parts = url.split("/detail/")
            if len(parts) > 1:
                extension_part = parts[1]
                candidate = extension_part.split("/")[-1].split("?")[0].rstrip("/").strip().lower()
        elif "id=" in url:
            match = re.search(r"id=([^&]+)", url)
            if match:
                candidate = match.group(1).strip().lower()

        if candidate and CHROME_EXTENSION_ID_PATTERN.match(candidate):
            return candidate
        if candidate:
            logger.warning("Extracted ID from URL did not match Chrome ID format [a-z]{32}: %s", candidate[:50])
        else:
            logger.warning("Could not extract extension ID from URL")
        return None

    except Exception as exc:
        logger.error("Error extracting extension ID: %s", exc)
        return None


def calculate_file_hash(file_path: str) -> Optional[str]:
    """Calculate SHA256 hash of downloaded file"""
    try:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    except Exception as exc:
        logger.error("Error calculating file hash: %s", exc)
        return None


def extract_extension_crx(file_path: str) -> Optional[str]:
    """Extract .crx file to a persistent directory for file viewing"""

    # Use persistent storage directory instead of /tmp
    try:
        # Get storage path from environment or use default
        storage_path = get_settings().extension_storage_path
        os.makedirs(storage_path, exist_ok=True)
        
        # Create extraction directory with unique name
        base_name = os.path.basename(file_path)
        extract_dir_name = f"extracted_{base_name}_{os.getpid()}"
        extract_dir = os.path.join(storage_path, extract_dir_name)
        os.makedirs(extract_dir, exist_ok=True)
        
        logger.info("Extracting .crx file to persistent storage: %s", extract_dir)

        if file_path.endswith(".crx"):
            # CRX files are ZIP files with a different header
            # We need to skip the first few bytes
            with open(file_path, "rb") as f:
                # Skip CRX header (first 4 bytes)
                f.seek(4)
                # Read the ZIP content
                zip_data = f.read()

            temp_zip = os.path.join(extract_dir, "temp.zip")
            with open(temp_zip, "wb") as f:
                f.write(zip_data)

            with zipfile.ZipFile(temp_zip, "r") as zip_ref:
                settings = get_settings()
                _check_zip_bomb_limits(
                    zip_ref,
                    settings.zip_extract_max_files,
                    settings.zip_extract_max_uncompressed_bytes,
                )
                # Safe extraction with zip-slip protection
                for member in zip_ref.infolist():
                    # Normalize path and check for zip-slip
                    target_path = os.path.join(extract_dir, member.filename)
                    abs_target = os.path.abspath(target_path)
                    abs_extract = os.path.abspath(extract_dir)
                    if not abs_target.startswith(abs_extract):
                        raise ValueError(f"Zip-slip attempt detected: {member.filename}")
                    zip_ref.extract(member, extract_dir)

            os.remove(temp_zip)

        elif file_path.endswith(".zip"):
            # Direct ZIP extraction with zip-slip protection
            with zipfile.ZipFile(file_path, "r") as zip_ref:
                settings = get_settings()
                _check_zip_bomb_limits(
                    zip_ref,
                    settings.zip_extract_max_files,
                    settings.zip_extract_max_uncompressed_bytes,
                )
                # Safe extraction with zip-slip protection
                for member in zip_ref.infolist():
                    # Normalize path and check for zip-slip
                    target_path = os.path.join(extract_dir, member.filename)
                    abs_target = os.path.abspath(target_path)
                    abs_extract = os.path.abspath(extract_dir)
                    if not abs_target.startswith(abs_extract):
                        raise ValueError(f"Zip-slip attempt detected: {member.filename}")
                    zip_ref.extract(member, extract_dir)

        else:
            logger.error("Unsupported file format for extraction: %s", file_path)
            return None

        return extract_dir
    except ValueError:
        # Zip-bomb and zip-slip rejections: propagate to caller
        raise
    except Exception as exc:
        logger.error("Error extracting .crx file: %s", exc)
        return None


def cleanup_downloaded_crx(crx_file_path: str):
    """
    Remove a downloaded CRX file with safety checks.

    Only deletes files within the extensions_storage directory.
    Logs warning if file doesn't exist (idempotent).

    Args:
        crx_file_path (str): Path to the CRX file to remove.

    Raises:
        ValueError: If file path is outside extensions_storage directory.
        OSError: If file deletion fails.
    """
    try:
        if not os.path.exists(crx_file_path):
            logger.warning("CRX file does not exist (already cleaned?): %s", crx_file_path)
            return

        # Safety: Only delete files within storage directory
        abs_crx_path = os.path.abspath(crx_file_path)
        storage_path = get_settings().extension_storage_path
        abs_storage_path = os.path.abspath(storage_path)

        if not abs_crx_path.startswith(abs_storage_path):
            logger.warning(
                "Refusing to delete CRX file outside storage directory: %s",
                abs_crx_path,
            )
            raise ValueError(f"CRX file path outside storage directory: {abs_crx_path}")

        os.remove(crx_file_path)
        logger.info("Cleaned up CRX file: %s", crx_file_path)

    except Exception as exc:
        logger.error("Error cleaning up CRX file %s: %s", crx_file_path, exc)
        raise


def is_chrome_extension_store_url(path: str) -> bool:
    """
    Check if the provided path is a valid Chrome Web Store URL

    Example:
        - "https://chromewebstore.google.com/detail/
          fantasypros-win-your-fant/gfbepnlhpkbgbkcebjnfhgjckibfdfkc"

    Args:
        path (str): The URL to check.

    Returns:
        bool: True if the URL matches the Chrome Web Store pattern, False otherwise.
    """
    return path.startswith("https://chromewebstore.google.com/detail/")


def is_local_extension_crx_file(path: str) -> bool:
    """
    Check if the provided path is a local CRX or ZIP file

    Args:
        path (str): The file path to check.

    Returns:
        bool: True if the path is a local .crx or .zip file, False otherwise.
    """
    if not path:
        return False
    return os.path.isfile(path) and (path.lower().endswith(".crx") or path.lower().endswith(".zip"))


def is_chrome_extension_id(path: str) -> bool:
    """
    Check if the provided string is a valid Chrome extension ID.
    Must match ^[a-z]{32}$ (32 lowercase letters).
    """
    if not path or not isinstance(path, str):
        return False
    return bool(CHROME_EXTENSION_ID_PATTERN.match(path.strip().lower()))
