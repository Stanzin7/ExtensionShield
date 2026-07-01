"""
Tests for scan file access control.

Security regression coverage:
- Public scans remain accessible.
- Private scans are hidden from non-owners.
- File list and file content endpoints do not leak private scan existence.
"""

from pathlib import Path
import tempfile

import pytest
from fastapi.testclient import TestClient

from extension_shield.api.main import app, scan_results


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def extracted_dir() -> Path:
    with tempfile.TemporaryDirectory() as temp_dir:
        root = Path(temp_dir)
        (root / "manifest.json").write_text('{"name":"Public Extension"}', encoding="utf-8")
        scripts_dir = root / "scripts"
        scripts_dir.mkdir()
        (scripts_dir / "content.js").write_text("console.log('hello');", encoding="utf-8")
        yield root


class TestPrivateScanFileAccess:
    def test_public_scan_file_list_is_accessible(self, client: TestClient, extracted_dir: Path):
        ext_id = "abcdefghijklmnopabcdefghijklmnop"
        scan_results[ext_id] = {
            "extension_id": ext_id,
            "status": "completed",
            "visibility": "public",
            "user_id": None,
            "extracted_path": str(extracted_dir),
        }

        try:
            response = client.get(f"/api/scan/files/{ext_id}")

            assert response.status_code == 200
            files = response.json()["files"]
            assert "manifest.json" in files
            assert "scripts/content.js" in files
        finally:
            scan_results.pop(ext_id, None)

    def test_private_scan_file_list_hidden_from_non_owner(self, client: TestClient, extracted_dir: Path):
        ext_id = "bcdefghijklmnopabcdefghijklmnopa"
        scan_results[ext_id] = {
            "extension_id": ext_id,
            "status": "completed",
            "visibility": "private",
            "user_id": "owner-user-123",
            "extracted_path": str(extracted_dir),
        }

        try:
            response = client.get(f"/api/scan/files/{ext_id}")

            assert response.status_code == 404
            assert response.json()["detail"] == "Scan results not found"
        finally:
            scan_results.pop(ext_id, None)

    def test_private_scan_file_content_hidden_from_non_owner(self, client: TestClient, extracted_dir: Path):
        ext_id = "cdefghijklmnopabcdefghijklmnopab"
        scan_results[ext_id] = {
            "extension_id": ext_id,
            "status": "completed",
            "visibility": "private",
            "user_id": "owner-user-123",
            "extracted_path": str(extracted_dir),
        }

        try:
            response = client.get(f"/api/scan/file/{ext_id}/scripts/content.js")

            assert response.status_code == 404
            assert response.json()["detail"] == "Scan results not found"
        finally:
            scan_results.pop(ext_id, None)
