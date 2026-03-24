from datetime import datetime, timezone, timedelta
import os

import base64
import mimetypes
from pathlib import Path
from typing import Optional, Dict, Any, List
import logging
from extension_shield.workflow.graph import build_graph
from extension_shield.workflow.state import WorkflowState, WorkflowStatus
from extension_shield.api.database import db, SupabaseDatabase, _is_extension_id
from extension_shield.api.supabase_auth import get_current_user_id as _get_current_user_id
from extension_shield.core.config import get_settings
from extension_shield.utils.mode import require_cloud, get_feature_flags, is_oss_telemetry_allowed, require_cloud_dep
from extension_shield.api.csp_middleware import CSPMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from extension_shield.scoring.engine import ScoringEngine
from extension_shield.governance.tool_adapters import SignalPackBuilder
from extension_shield.api.payload_helpers import (
    build_publisher_disclosures,
    build_report_view_model_safe,
    ensure_consumer_insights,
    ensure_description_in_meta,
    ensure_name_in_payload,
    log_scan_results_return_shape,
    upgrade_legacy_payload,
)
# Import safe JSON utilities from shared module
from extension_shield.utils.json_encoder import (
    safe_json_dumps,
    safe_json_dump,
    sanitize_for_json,
)
# User-friendly error message for service unavailability
SERVICE_UNAVAILABLE_MESSAGE = "ExtensionShield is temporarily unavailable. We're working to restore service and will be back shortly. Please try again in a few minutes."
_settings = get_settings()
STORAGE_PATH = _settings.extension_storage_path
RESULTS_DIR = _settings.paths.results_dir  # Convert to absolute path
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
from extension_shield.api.scoring_legacy import (  # noqa: E402
    calculate_security_score,
    determine_overall_risk,
    count_total_findings,
    calculate_total_risk_score,
)
from extension_shield.api.shared import (  # noqa: E402
    scan_results,
    scan_status,
    scan_user_ids,
    scan_source,
)
_MAX_ICON_BYTES_FOR_DB = 2 * 1024 * 1024
# Initialize logger
# logging.basicConfig(
#     level=logging.INFO,  
#     format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
# )
logger = logging.getLogger(__name__)
# //Run analysis workflow in background task to avoid blocking API response and allow real-time status updates via GET /api/scan/status/:id
async def run_analysis_workflow(url: str, extension_id: str):
    """Run the analysis workflow in the background."""
    workflow_start = datetime.now()
    print(f"Starting analysis workflow for {extension_id} at {workflow_start.isoformat()}")
    logger.info("[TIMELINE] scan_started → extension_id=%s, url=%s", extension_id, url)
    # return
    
    try:
        # Update status
        scan_status[extension_id] = "running"
        logger.info("[TIMELINE] status_set_to_running → extension_id=%s", extension_id)

        # Build and run workflow
        logger.info("[TIMELINE] building_workflow_graph → extension_id=%s", extension_id)
        graph = build_graph()
        logger.info("[TIMELINE] workflow_graph_built → extension_id=%s", extension_id)

        initial_state: WorkflowState = {
            "workflow_id": extension_id,
            "chrome_extension_path": url,
            "extension_dir": None,
            "downloaded_crx_path": None,
            "extension_metadata": None,
            "manifest_data": None,
            "analysis_results": None,
            "executive_summary": None,
            "extracted_files": None,
            # Governance fields
            "governance_bundle": None,
            "governance_verdict": None,
            "governance_report": None,
            "governance_error": None,
            # Status fields
            "status": WorkflowStatus.PENDING,
            "start_time": datetime.now().isoformat(),
            "end_time": None,
            "error": None,
        }

        # Run workflow
        logger.info("[TIMELINE] executing_workflow → extension_id=%s", extension_id)
        final_state = await graph.ainvoke(initial_state)
        print(f"Completed analysis workflow for {extension_id} at {datetime.now().isoformat()}")
        logger.info("[TIMELINE] workflow_completed → extension_id=%s, status=%s", extension_id, final_state.get("status"))

        # Store results
        if (
            final_state["status"] == WorkflowStatus.COMPLETED
            or final_state["status"] == "completed"
        ):
            analysis_results = final_state.get("analysis_results", {}) or {}

            # Extract extension name from metadata or manifest
            # Check all possible sources: webstore metadata, chromestats metadata, parsed manifest
            metadata = final_state.get("extension_metadata") or {}
            manifest = final_state.get("manifest_data") or {}
            chrome_stats = metadata.get("chrome_stats") or {}
            _name_candidates = [
                metadata.get("title"),
                metadata.get("name"),
                chrome_stats.get("name") if isinstance(chrome_stats, dict) else None,
                manifest.get("name"),
            ]
            extension_name = next(
                (n for n in _name_candidates if n and isinstance(n, str) and n.strip() and n.strip() != "Unknown"),
                extension_id,
            )

            # Ensure all values are not None
            extracted_files = final_state.get("extracted_files")
            if extracted_files is None:
                extracted_files = []

            # Extract icon path from manifest
            extracted_path = final_state.get("extension_dir")
            icon_path = extract_icon_path(manifest, extracted_path)
            if not icon_path and extracted_path:
                icon_path = _find_icon_path_on_disk(extracted_path, manifest)
            icon_base64, icon_media_type = _extract_icon_blob_for_storage(
                icon_path=icon_path,
                extracted_path=extracted_path,
            )

            # =================================================================
            # V2 SCORING: Build SignalPack and compute scores via ScoringEngine
            # =================================================================
            signal_pack_builder = SignalPackBuilder()
            signal_pack = signal_pack_builder.build(
                scan_id=extension_id,
                analysis_results=analysis_results,
                metadata=metadata,
                manifest=manifest,
                extension_id=extension_id,
            )
            
            # Determine user count for context-aware scoring
            user_count = signal_pack.webstore_stats.installs
            if user_count is None:
                # Fallback to metadata if available
                user_count = metadata.get("users") or metadata.get("user_count")
            
            # Compute v2 scores
            logger.info("[TIMELINE] computing_scores → extension_id=%s", extension_id)
            scoring_engine = ScoringEngine(weights_version="v1")
            scoring_result = scoring_engine.calculate_scores(
                signal_pack=signal_pack,
                manifest=manifest,
                user_count=user_count,
            )
            logger.info("[TIMELINE] scores_computed → extension_id=%s, overall_score=%s", extension_id, scoring_result.overall_score)
            
            # Build scoring_v2 payload for API response (include gate/override breakdown for QA)
            scoring_v2_payload = {
                "scoring_version": "v2",
                "weights_version": "v1",
                "security_score": scoring_result.security_score,
                "privacy_score": scoring_result.privacy_score,
                "governance_score": scoring_result.governance_score,
                "overall_score": scoring_result.overall_score,
                "overall_confidence": scoring_result.overall_confidence,
                "decision": scoring_result.decision.value,
                "decision_reasons": scoring_result.reasons,
                "hard_gates_triggered": scoring_result.hard_gates_triggered,
                "risk_level": scoring_result.risk_level.value,
                "explanation": scoring_result.explanation,
            }
            if scoring_result.base_overall is not None:
                scoring_v2_payload["base_overall"] = scoring_result.base_overall
            if scoring_result.gate_penalty is not None:
                scoring_v2_payload["gate_penalty"] = scoring_result.gate_penalty
            if scoring_result.gate_reasons is not None:
                scoring_v2_payload["gate_reasons"] = scoring_result.gate_reasons
            if scoring_result.coverage_cap_applied is not None:
                scoring_v2_payload["coverage_cap_applied"] = scoring_result.coverage_cap_applied
            if scoring_result.coverage_cap_reason is not None:
                scoring_v2_payload["coverage_cap_reason"] = scoring_result.coverage_cap_reason

            # Build scan results - sanitize complex objects to prevent circular references
            raw_results = {
                "extension_id": extension_id,
                "extension_name": extension_name,
                "url": url,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "completed",
                "metadata": metadata,
                "manifest": manifest,
                "permissions_analysis": analysis_results.get("permissions_analysis") or {},
                "sast_results": analysis_results.get("javascript_analysis") or {},
                "webstore_analysis": analysis_results.get("webstore_analysis") or {},
                "virustotal_analysis": analysis_results.get("virustotal_analysis") or {},
                "entropy_analysis": analysis_results.get("entropy_analysis") or {},
                "summary": final_state.get("executive_summary") or {},
                "impact_analysis": analysis_results.get("impact_analysis") or {},
                "privacy_compliance": analysis_results.get("privacy_compliance") or {},
                "extracted_path": _storage_relative_extracted_path(final_state.get("extension_dir")),
                "extracted_files": extracted_files,
                "icon_path": icon_path,  # Relative path to icon (e.g., "icons/128.png")
                "icon_base64": icon_base64,  # Persisted icon bytes for environments with ephemeral storage
                "icon_media_type": icon_media_type,
                # UI-first payload (production) - handle LLM failures gracefully
                "report_view_model": build_report_view_model_safe(
                    manifest=manifest,
                    analysis_results={**analysis_results, "executive_summary": final_state.get("executive_summary") or {}},
                    metadata=metadata,
                    extension_id=extension_id,
                    scan_id=extension_id,
                ),
                # V2 scoring - overall_security_score for backward compatibility
                "overall_security_score": scoring_result.overall_score,
                # Explicit v2 keys for new consumers
                "security_score": scoring_result.security_score,
                "privacy_score": scoring_result.privacy_score,
                "governance_score": scoring_result.governance_score,
                "overall_confidence": scoring_result.overall_confidence,
                "decision_v2": scoring_result.decision.value,
                "decision_reasons_v2": scoring_result.reasons,
                # Full v2 scoring payload
                "scoring_v2": scoring_v2_payload,
                # Legacy helper outputs (kept for backward compatibility)
                "total_findings": count_total_findings(final_state),
                "risk_distribution": calculate_risk_distribution(final_state),
                "overall_risk": scoring_result.risk_level.value,  # Use v2 risk level
                "total_risk_score": calculate_total_risk_score(final_state),
                # Governance data (Pipeline B: Stages 2-8) - sanitize to prevent circular refs
                "governance_verdict": final_state.get("governance_verdict"),
                "governance_bundle": sanitize_for_json(final_state.get("governance_bundle")),
                "governance_report": sanitize_for_json(final_state.get("governance_report")),
                "governance_error": final_state.get("governance_error"),
                "publisher_disclosures": build_publisher_disclosures(
                    metadata, final_state.get("governance_bundle")
                ),
            }

            # Final sanitization pass to ensure JSON-serializability
            scan_results[extension_id] = sanitize_for_json(raw_results)
            logger.info("[TIMELINE] report_view_model_built → extension_id=%s, has_rvm=%s", extension_id, bool(scan_results[extension_id].get("report_view_model")))

            # Private upload: set user_id, visibility, source before save (so uploads are scoped and excluded from public feed)
            user_id = scan_user_ids.pop(extension_id, None)
            source = scan_source.pop(extension_id, None)
            scan_results[extension_id]["user_id"] = user_id
            scan_results[extension_id]["visibility"] = "private" if source == "upload" else "public"
            scan_results[extension_id]["source"] = source if source else "webstore"

            # Save to database *before* marking completed so GET /api/scan/results/:id finds the row
            logger.info("[TIMELINE] saving_to_database → extension_id=%s", extension_id)
            save_success = db.save_scan_result(scan_results[extension_id])
            if not save_success:
                logger.error("[TIMELINE] FAILED to save to database → extension_id=%s", extension_id)
            else:
                logger.info("[TIMELINE] saved_to_database → extension_id=%s, success=%s", extension_id, save_success)

            # Save to user history (best-effort; anonymous scans are not saved)
            if user_id:
                try:
                    db.add_user_scan_history(user_id=user_id, extension_id=extension_id)
                except Exception:
                    pass

            # Save to file (backup) - use safe JSON encoder to handle circular references
            logger.info("[TIMELINE] saving_to_file → extension_id=%s", extension_id)
            result_file = RESULTS_DIR / f"{extension_id}_results.json"
            try:
                with open(result_file, "w", encoding="utf-8") as f:
                    success = safe_json_dump(scan_results[extension_id], f, indent=2)
                if success:
                    logger.info("[TIMELINE] saved_to_file → extension_id=%s, file=%s", extension_id, result_file)
                else:
                    logger.warning("[TIMELINE] file_save_partial → extension_id=%s, file=%s", extension_id, result_file)
            except Exception as file_error:
                logger.error("[TIMELINE] file_save_failed → extension_id=%s, error=%s", extension_id, str(file_error))
                # Don't fail the scan if file save fails - database is the primary storage

            # Mark completed only after DB (and file) save so GET /api/scan/results/:id returns 200
            scan_status[extension_id] = "completed"
            workflow_duration = (datetime.now() - workflow_start).total_seconds()
            logger.info("[TIMELINE] scan_complete → extension_id=%s, duration=%.2fs", extension_id, workflow_duration)
        else:
            scan_status[extension_id] = "failed"
            logger.error("[TIMELINE] scan_failed → extension_id=%s, status=%s, error=%s", extension_id, final_state.get("status"), final_state.get("error"))
            # Use store metadata for name when download failed but we have extension_metadata from earlier node
            ext_meta = final_state.get("extension_metadata") or {}
            ext_meta = ext_meta if isinstance(ext_meta, dict) else {}
            resolved_name = (
                ext_meta.get("title") or ext_meta.get("name")
                or (ext_meta.get("chrome_stats") or {}).get("name") if isinstance(ext_meta.get("chrome_stats"), dict) else None
            ) or extension_id
            failed_payload = {
                "extension_id": extension_id,
                "extension_name": resolved_name,
                "url": url,
                "status": "failed",
                "error": _sanitize_error_for_client(final_state.get("error", "Unknown error")),
                "metadata": ext_meta,
                "manifest": {},
                "overall_security_score": 0,
                "overall_risk": "unknown",
                "total_findings": 0,
                "risk_distribution": {"high": 0, "medium": 0, "low": 0},
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
            scan_results[extension_id] = failed_payload
            try:
                db.save_scan_result(failed_payload)
                logger.info("[TIMELINE] saved failed scan to database → extension_id=%s", extension_id)
            except Exception as save_err:
                logger.warning("[TIMELINE] failed to save failed scan to database → extension_id=%s, error=%s", extension_id, save_err)

    except Exception as e:
        scan_status[extension_id] = "failed"
        import traceback
        logger.error("[TIMELINE] workflow_exception → extension_id=%s, error=%s", extension_id, str(e))
        logger.error("[TIMELINE] workflow_exception_traceback → extension_id=%s\n%s", extension_id, traceback.format_exc())
        
        # Check for errors and provide user-friendly messages
        # All error messages should be user-friendly and not expose internal API details
        error_str = str(e)
        error_code = 503  # Default to service unavailable
        
        # User-friendly message for all service errors
        # Don't expose internal API details to users
        error_message = SERVICE_UNAVAILABLE_MESSAGE
        
        # Check for specific error types for internal logging (but use friendly message for user)
        if any(keyword in error_str.lower() for keyword in [
            "sk-proj-", "invalid_api_key", "incorrect api key", "authentication",
            "401", "api key", "apikey"
        ]):
            error_code = 503
            logger.error("[WORKFLOW] API authentication error: %s", error_str)
        elif any(keyword in error_str.lower() for keyword in [
            "connection refused", "errno 61", "errno 111", "timeout", "connection error"
        ]):
            error_code = 503
            logger.error("[WORKFLOW] Connection error: %s", error_str)
        elif any(keyword in error_str.lower() for keyword in [
            "token_quota_reached", "quota", "403", "rate limit"
        ]):
            error_code = 503
            logger.error("[WORKFLOW] Quota/rate limit error: %s", error_str)
        elif any(keyword in error_str.lower() for keyword in [
            "virustotal", "chromestats", "chrome-stats"
        ]):
            error_code = 503
            logger.error("[WORKFLOW] External service error: %s", error_str)
        else:
            logger.error("[WORKFLOW] Unknown error: %s", error_str)
        
        scan_results[extension_id] = {
            "extension_id": extension_id,
            "extension_name": extension_id,
            "url": url,
            "status": "failed",
            "error": _sanitize_error_for_client(error_message),
            "error_code": error_code,
            "metadata": {},
            "manifest": {},
            "overall_security_score": 0,
            "overall_risk": "unknown",
            "total_findings": 0,
            "risk_distribution": {"high": 0, "medium": 0, "low": 0},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        try:
            db.save_scan_result(scan_results[extension_id])
            logger.info("[TIMELINE] saved failed scan to database → extension_id=%s", extension_id)
        except Exception as save_err:
            logger.warning("[TIMELINE] failed to save failed scan to database → extension_id=%s, error=%s", extension_id, save_err)


def extract_icon_path(manifest: Dict[str, Any], extracted_path: Optional[str]) -> Optional[str]:
    """
    Extract icon path from manifest.json.
    
    Returns the relative path to the icon file (e.g., "icons/128.png")
    based on manifest.json icons field, or None if not found.
    
    Args:
        manifest: Parsed manifest.json dict
        extracted_path: Path to extracted extension directory (for validation)
    
    Returns:
        Relative icon path (e.g., "icons/128.png") or None
    """
    if not manifest or not isinstance(manifest, dict):
        return None
    
    icons = manifest.get("icons", {})
    if not icons or not isinstance(icons, dict):
        return None
    
    # Get the largest icon (prefer 128, then 64, then 48, etc.)
    icon_sizes = ["128", "64", "48", "32", "16", "96", "256", "38", "19"]
    for size in icon_sizes:
        if size in icons:
            icon_path = icons[size]
            if isinstance(icon_path, str):
                # Validate path exists if extracted_path is available
                if extracted_path:
                    full_path = os.path.join(extracted_path, icon_path)
                    if os.path.exists(full_path):
                        return icon_path
                else:
                    # Return path even if we can't validate (for database storage)
                    return icon_path
    
    return None
def _find_icon_path_on_disk(
    extracted_path: Optional[str], manifest: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Find a real icon file path inside an extracted extension directory.

    This is used at scan completion to persist icon bytes even when manifest.icons is missing
    or points to a non-existent file. It intentionally mirrors the icon endpoint's fallback
    search strategy, but returns a relative path suitable for DB storage (e.g. "icons/128.png").
    """
    if not extracted_path:
        return None
    if not os.path.isdir(extracted_path):
        return None

    ex = extracted_path
    ex_abs = os.path.abspath(ex)

    def _candidate(rel_parts: list[str]) -> Optional[str]:
        abs_path = os.path.abspath(os.path.join(ex, *rel_parts))
        if os.path.commonpath([ex_abs, abs_path]) != ex_abs:
            return None
        if os.path.isfile(abs_path):
            return _relpath_from_extracted(ex, abs_path)
        return None

    # 1) If manifest provides icon paths, try all of them (largest-first if keys are numeric).
    icons = (manifest or {}).get("icons") if isinstance(manifest, dict) else None
    if isinstance(icons, dict) and icons:
        def _key_to_int(k: Any) -> int:
            try:
                return int(str(k))
            except Exception:
                return -1

        # Prefer numeric keys (sizes) descending; otherwise preserve insertion order.
        icon_items = list(icons.items())
        if any(_key_to_int(k) >= 0 for k, _ in icon_items):
            icon_items.sort(key=lambda kv: _key_to_int(kv[0]), reverse=True)

        for _, rel in icon_items:
            if isinstance(rel, str) and rel:
                found = _candidate([rel])
                if found:
                    return found

    # 2) Common conventions (icons/, root, images/)
    icon_sizes = ["256", "128", "96", "64", "48", "32", "16"]
    exts = [".png", ".jpg", ".jpeg", ".webp", ".svg"]

    # icons/<size>.(png|...)
    for size in icon_sizes:
        for ext in exts:
            found = _candidate(["icons", f"{size}{ext}"])
            if found:
                return found
            found = _candidate(["icons", f"icon{size}{ext}"])
            if found:
                return found

    # root icon files
    for size in icon_sizes:
        for ext in exts:
            for name in (f"icon{size}{ext}", f"{size}{ext}", f"icon_{size}{ext}"):
                found = _candidate([name])
                if found:
                    return found

    # images/ common names
    for name in (
        "icon256.png",
        "icon128.png",
        "icon96.png",
        "icon64.png",
        "icon48.png",
        "icon32.png",
        "icon16.png",
        "icon.png",
        "logo.png",
        "logo.svg",
    ):
        found = _candidate(["images", name])
        if found:
            return found

    # 3) Last resort: pick the largest-looking image in icons/ or images/
    for folder in ("icons", "images"):
        folder_abs = os.path.join(ex, folder)
        if not os.path.isdir(folder_abs):
            continue
        try:
            candidates = []
            for item in os.listdir(folder_abs):
                lower = item.lower()
                if not any(lower.endswith(ext) for ext in exts):
                    continue
                abs_path = os.path.abspath(os.path.join(folder_abs, item))
                if os.path.commonpath([ex_abs, abs_path]) != ex_abs:
                    continue
                if not os.path.isfile(abs_path):
                    continue
                try:
                    size_bytes = os.path.getsize(abs_path)
                except Exception:
                    size_bytes = 0
                candidates.append((size_bytes, abs_path))
            if candidates:
                candidates.sort(key=lambda t: t[0], reverse=True)
                rel = _relpath_from_extracted(ex, candidates[0][1])
                if rel:
                    return rel
        except Exception:
            continue

    return None
def _relpath_from_extracted(extracted_path: str, abs_path: str) -> Optional[str]:
    """Return a safe, normalized (POSIX) relpath within extracted_path."""
    try:
        rel = os.path.relpath(abs_path, start=extracted_path)
    except Exception:
        return None
    # Guard: must stay within extracted_path
    if rel.startswith(".."):
        return None
    return rel.replace(os.sep, "/")
def _sanitize_error_for_client(text: str) -> str:
    """Strip competitor/service names from error messages shown to the client."""
    if not text or not isinstance(text, str):
        return text or ""
    for phrase in ("Google CRX", "ChromeStats", "chrome-stats", "chromestats"):
        if phrase in text:
            text = text.replace(phrase, "download source")
    return text
def _storage_relative_extracted_path(extension_dir: Optional[str]) -> Optional[str]:
    """
    Return extracted_path in a form resolvable on any backend: path relative to
    extension_storage_path (e.g. extracted_<id>.crx_123 or extracted_<id>.zip_9/1.0.0_0
    when the zip had a top-level version folder). Icon endpoint joins this with
    extension_storage_path so icons work when DB is Supabase and storage is local.
    """
    if not extension_dir:
        return None
    storage_path = get_settings().extension_storage_path
    try:
        rel = os.path.relpath(extension_dir.rstrip(os.sep), storage_path)
        # Avoid storing paths that escape storage (e.g. "..")
        if rel.startswith("..") or os.path.isabs(rel):
            return os.path.basename(extension_dir.rstrip(os.sep))
        return rel
    except ValueError:
        return os.path.basename(extension_dir.rstrip(os.sep))
def calculate_risk_distribution(state: WorkflowState) -> Dict[str, int]:
    """Calculate distribution of risk levels."""
    distribution = {"high": 0, "medium": 0, "low": 0}
    analysis_results = state.get("analysis_results", {}) or {}
    javascript_analysis = analysis_results.get("javascript_analysis", {})
    js_analysis = []
    if javascript_analysis and isinstance(javascript_analysis, dict):
        sast_findings = javascript_analysis.get("sast_findings", {})
        for findings_list in sast_findings.values():
            if findings_list is not None:
                js_analysis.extend(findings_list)
    elif isinstance(javascript_analysis, list):
        js_analysis = javascript_analysis

    for finding in js_analysis:
        risk_level = finding.get("extra", {}).get("severity", "INFO").lower()
        if risk_level in ("critical", "high"):
            distribution["high"] += 1
        elif risk_level in ("error", "medium"):
            distribution["medium"] += 1
        else:
            distribution["low"] += 1

    permissions_analysis = analysis_results.get("permissions_analysis", {}) or {}
    permissions_details = (
        permissions_analysis.get("permissions_details")
        if isinstance(permissions_analysis, dict)
        else None
    )
    if not isinstance(permissions_details, dict):
        permissions_details = {}
    for _, perm_analysis in permissions_details.items():
        is_reasonable = perm_analysis.get("is_reasonable", True)
        risk = perm_analysis.get("risk_level", "").lower()
        if not is_reasonable:
            if risk == "high":
                distribution["high"] += 1
            elif risk == "low":
                distribution["low"] += 1
            else:
                distribution["medium"] += 1
    return distribution
def _extract_icon_blob_for_storage(
    icon_path: Optional[str], extracted_path: Optional[str]
) -> tuple[Optional[str], Optional[str]]:
    """Encode icon bytes to base64 for DB persistence (production-safe fallback)."""
    if not icon_path or not extracted_path:
        return None, None
    try:
        abs_extracted_path = os.path.abspath(extracted_path)
        candidate_path = (
            os.path.abspath(icon_path)
            if os.path.isabs(icon_path)
            else os.path.abspath(os.path.join(extracted_path, icon_path))
        )

        # Security check: icon must stay inside extracted extension dir.
        if os.path.commonpath([abs_extracted_path, candidate_path]) != abs_extracted_path:
            logger.warning("[ICON] Refusing out-of-bounds icon path for persistence: %s", icon_path)
            return None, None
        if not os.path.isfile(candidate_path):
            return None, None

        with open(candidate_path, "rb") as icon_file:
            icon_bytes = icon_file.read()
        if not icon_bytes:
            return None, None
        if len(icon_bytes) > _MAX_ICON_BYTES_FOR_DB:
            logger.warning(
                "[ICON] Skipping icon persistence for oversized icon (%s bytes): %s",
                len(icon_bytes),
                candidate_path,
            )
            return None, None

        icon_b64 = base64.b64encode(icon_bytes).decode("ascii")
        guessed_media_type, _ = mimetypes.guess_type(candidate_path)
        media_type = _normalize_image_media_type(guessed_media_type)
        return icon_b64, media_type
    except Exception as exc:
        logger.warning("[ICON] Failed to persist icon bytes for %s: %s", icon_path, exc)
        return None, None
    
def _normalize_image_media_type(media_type: Optional[str]) -> str:
    """Normalize media type for icon responses."""
    if not media_type or not isinstance(media_type, str):
        return "image/png"
    normalized = media_type.strip().lower()
    if not normalized.startswith("image/"):
        return "image/png"
    return normalized