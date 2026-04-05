import sqlite3
import json
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List
from contextlib import contextmanager

from extension_shield.core.config import get_settings
from extension_shield.utils.json_encoder import safe_json_dumps
from extension_shield.storage.base import ScanStore
from extension_shield.storage.utils import _generate_slug, _is_extension_id

logger = logging.getLogger(__name__)

class SQLiteDatabase(ScanStore):
    """SQLite database manager (dev fallback when Postgres/Supabase is not used)."""

    def __init__(self, db_path: str = None):
        """Initialize database connection.

        Args:
            db_path: Path to SQLite database file. If None, uses DATABASE_PATH
                     environment variable or defaults to 'project-atlas.db'.
                     Used only when DB_BACKEND=sqlite (dev fallback).
        """
        if db_path is None:
            db_path = get_settings().database_path
        self.db_path = Path(db_path)
        # Ensure parent directory exists
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_database()

    @contextmanager
    def get_connection(self):
        """Context manager for database connections."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_database(self):
        """Initialize database schema."""
        with self.get_connection() as conn:
            cursor = conn.cursor()

            # Local metrics (OSS: pageview/event when OSS_TELEMETRY_ENABLED; Cloud: same table)
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS page_views_daily (
                    day TEXT NOT NULL,
                    path TEXT NOT NULL,
                    count INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (day, path)
                )
            """
            )

            # User-scoped scan history (references global scan_results by extension_id)
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS user_scan_history (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    extension_id TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
            """
            )
            # Migration: add last_viewed_at for bumping re-scanned extensions to top
            try:
                cursor.execute("ALTER TABLE user_scan_history ADD COLUMN last_viewed_at TEXT")
            except sqlite3.OperationalError:
                pass  # column already exists

            # Scan results table
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    extension_id TEXT UNIQUE NOT NULL,
                    extension_name TEXT,
                    url TEXT,
                    timestamp TEXT NOT NULL,
                    status TEXT NOT NULL,
                    security_score INTEGER,
                    risk_level TEXT,
                    total_findings INTEGER DEFAULT 0,
                    total_files INTEGER DEFAULT 0,
                    high_risk_count INTEGER DEFAULT 0,
                    medium_risk_count INTEGER DEFAULT 0,
                    low_risk_count INTEGER DEFAULT 0,
                    metadata TEXT,
                    manifest TEXT,
                    permissions_analysis TEXT,
                    sast_results TEXT,
                    webstore_analysis TEXT,
                    summary TEXT,
                    extracted_path TEXT,
                    extracted_files TEXT,
                    icon_path TEXT,
                    icon_base64 TEXT,
                    icon_media_type TEXT,
                    error TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
            
            # Add icon_path column if it doesn't exist (for existing databases)
            try:
                cursor.execute("ALTER TABLE scan_results ADD COLUMN icon_path TEXT")
            except Exception:
                # Column already exists, ignore
                pass
            try:
                cursor.execute("ALTER TABLE scan_results ADD COLUMN icon_base64 TEXT")
            except Exception:
                # Column already exists, ignore
                pass
            try:
                cursor.execute("ALTER TABLE scan_results ADD COLUMN icon_media_type TEXT")
            except Exception:
                # Column already exists, ignore
                pass
            try:
                cursor.execute("ALTER TABLE scan_results ADD COLUMN slug TEXT")
            except Exception:
                pass
            try:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_scan_results_slug ON scan_results(slug)")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE scan_results ADD COLUMN user_id TEXT")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE scan_results ADD COLUMN visibility TEXT DEFAULT 'public'")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE scan_results ADD COLUMN source TEXT DEFAULT 'webstore'")
            except Exception:
                pass

            # Statistics table for aggregated metrics
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS statistics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    metric_name TEXT UNIQUE NOT NULL,
                    metric_value INTEGER DEFAULT 0,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """
            )

            # Initialize default statistics
            cursor.execute(
                """
                INSERT OR IGNORE INTO statistics (metric_name, metric_value)
                VALUES 
                    ('total_scans', 0),
                    ('high_risk_extensions', 0),
                    ('total_files_analyzed', 0),
                    ('total_vulnerabilities', 0)
            """
            )

            # Create indexes for better query performance
            # Note: idx_extension_id omitted - extension_id UNIQUE already creates sqlite_autoindex
            # Migration: drop redundant idx_extension_id if it exists (duplicate of UNIQUE's autoindex)
            try:
                cursor.execute("DROP INDEX IF EXISTS idx_extension_id")
            except Exception:
                pass
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_timestamp 
                ON scan_results(timestamp DESC)
            """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_risk_level 
                ON scan_results(risk_level)
            """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_page_views_day
                ON page_views_daily(day)
            """
            )

            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_user_scan_history_user_created
                ON user_scan_history(user_id, created_at DESC)
            """
            )

            # Scan result feedback (per-scan user feedback)
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS scan_feedback (
                    id TEXT PRIMARY KEY,
                    scan_id TEXT NOT NULL,
                    helpful INTEGER NOT NULL,
                    reason TEXT,
                    suggested_score INTEGER,
                    comment TEXT,
                    user_id TEXT,
                    model_version TEXT,
                    ruleset_version TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_scan_feedback_scan_id
                ON scan_feedback(scan_id)
            """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_scan_feedback_created_at
                ON scan_feedback(created_at DESC)
            """
            )

    def save_scan_result(self, result: Dict[str, Any]) -> bool:
        """Save or update scan result."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Extract metadata
                extension_id = result.get("extension_id")
                metadata = result.get("metadata", {}) or {}
                manifest = result.get("manifest", {}) or {}
                chrome_stats = metadata.get("chrome_stats") or {}
                # Get extension_name from top-level first, then try metadata/manifest fields
                _name_candidates = [
                    result.get("extension_name"),
                    metadata.get("title"),
                    metadata.get("name"),
                    chrome_stats.get("name") if isinstance(chrome_stats, dict) else None,
                    manifest.get("name"),
                ]
                extension_name = next(
                    (n for n in _name_candidates if n and isinstance(n, str) and n.strip() and n.strip() != "Unknown"),
                    extension_id,
                )

                # Calculate risk distribution
                risk_dist = result.get("risk_distribution", {})

                # Enhance summary with modern fields for signals and risk calculation
                summary_data = result.get("summary", {}) or {}
                if not isinstance(summary_data, dict):
                    summary_data = {}
                
                # Store modern fields in summary JSON for backward compatibility
                # These fields are needed for frontend signal calculation
                if result.get("scoring_v2"):
                    summary_data["scoring_v2"] = result.get("scoring_v2")
                if result.get("report_view_model"):
                    summary_data["report_view_model"] = result.get("report_view_model")
                if result.get("governance_bundle"):
                    summary_data["governance_bundle"] = result.get("governance_bundle")
                if result.get("virustotal_analysis"):
                    summary_data["virustotal_analysis"] = result.get("virustotal_analysis")

                slug = _generate_slug(extension_name) if extension_name else ""

                cursor.execute(
                    """
                    INSERT OR REPLACE INTO scan_results (
                        extension_id, extension_name, slug, url, timestamp, status,
                        security_score, risk_level, total_findings, total_files,
                        high_risk_count, medium_risk_count, low_risk_count,
                        metadata, manifest, permissions_analysis, sast_results,
                        webstore_analysis, summary, extracted_path, extracted_files,
                        icon_path, icon_base64, icon_media_type, error, updated_at,
                        user_id, visibility, source
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        extension_id,
                        extension_name,
                        slug,
                        result.get("url"),
                        result.get("timestamp"),
                        result.get("status"),
                        result.get("overall_security_score"),
                        result.get("overall_risk"),
                        result.get("total_findings", 0),
                        len(result.get("extracted_files") or []),
                        risk_dist.get("high", 0),
                        risk_dist.get("medium", 0),
                        risk_dist.get("low", 0),
                        safe_json_dumps(result.get("metadata", {})),
                        safe_json_dumps(result.get("manifest", {})),
                        safe_json_dumps(result.get("permissions_analysis", {})),
                        safe_json_dumps(result.get("sast_results", {})),
                        safe_json_dumps(result.get("webstore_analysis", {})),
                        safe_json_dumps(summary_data),
                        result.get("extracted_path"),
                        safe_json_dumps(result.get("extracted_files", [])),
                        result.get("icon_path"),  # Relative path to icon (e.g., "icons/128.png")
                        result.get("icon_base64"),  # Persisted icon bytes for prod fallback
                        result.get("icon_media_type"),
                        result.get("error"),
                        datetime.now().isoformat(),
                        result.get("user_id"),
                        result.get("visibility", "public"),
                        result.get("source", "webstore"),
                    ),
                )

                # Update statistics
                self._update_statistics()

                logger.info(f"[save_scan_result SQLite] Saved scan for extension_id={extension_id}")
                return True
        except Exception as e:
            import traceback
            logger.error(f"[save_scan_result SQLite] ERROR for extension_id={result.get('extension_id')}: {e}\n{traceback.format_exc()}")
            return False

    def increment_page_view(self, day: str, path: str) -> int:
        """
        Increment a page view count for a given UTC day + path.

        Args:
            day: YYYY-MM-DD (UTC)
            path: Route path (e.g., /research)

        Returns:
            Updated count
        """
        path = (path or "/").strip()
        if not path.startswith("/"):
            path = "/" + path

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO page_views_daily (day, path, count)
                VALUES (?, ?, 1)
                ON CONFLICT(day, path) DO UPDATE SET count = count + 1
            """,
                (day, path),
            )
            cursor.execute(
                "SELECT count FROM page_views_daily WHERE day = ? AND path = ?",
                (day, path),
            )
            row = cursor.fetchone()
            return int(row["count"]) if row else 0

    def get_page_view_summary(self, days: int = 14) -> Dict[str, Any]:
        """
        Return aggregate telemetry counts for the last N UTC days.

        Returns:
            {
              "days": int,
              "start_day": "YYYY-MM-DD",
              "end_day": "YYYY-MM-DD",
              "by_day": { "YYYY-MM-DD": int },
              "by_path": { "/research": int },
              "rows": [{ "day": "...", "path": "...", "count": 123 }]
            }
        """
        days = int(days or 14)
        days = max(1, min(days, 365))

        now_utc = datetime.now(timezone.utc).date()
        start_date = now_utc - timedelta(days=days - 1)
        start_day = start_date.strftime("%Y-%m-%d")
        end_day = now_utc.strftime("%Y-%m-%d")

        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT day, path, count
                FROM page_views_daily
                WHERE day >= ?
                ORDER BY day ASC, path ASC
            """,
                (start_day,),
            )
            rows = [dict(r) for r in cursor.fetchall()]

        by_day: Dict[str, int] = {}
        by_path: Dict[str, int] = {}
        for r in rows:
            d = r.get("day")
            p = r.get("path")
            c = int(r.get("count") or 0)
            if d:
                by_day[d] = by_day.get(d, 0) + c
            if p:
                by_path[p] = by_path.get(p, 0) + c

        return {
            "days": days,
            "start_day": start_day,
            "end_day": end_day,
            "by_day": by_day,
            "by_path": by_path,
            "rows": rows,
        }

    def add_user_scan_history(self, user_id: str, extension_id: str) -> bool:
        """
        Insert or update a user-scoped scan history entry. Re-scans bump the extension to top.
        """
        try:
            now = datetime.now(timezone.utc).isoformat()
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT id FROM user_scan_history
                    WHERE user_id = ? AND extension_id = ?
                    LIMIT 1
                """,
                    (user_id, extension_id),
                )
                existing = cursor.fetchone()
                if existing:
                    cursor.execute(
                        """
                        UPDATE user_scan_history SET last_viewed_at = ?
                        WHERE user_id = ? AND extension_id = ?
                    """,
                        (now, user_id, extension_id),
                    )
                    return True
                row_id = str(uuid.uuid4())
                cursor.execute(
                    """
                    INSERT INTO user_scan_history (id, user_id, extension_id, created_at, last_viewed_at)
                    VALUES (?, ?, ?, ?, ?)
                """,
                    (row_id, user_id, extension_id, now, now),
                )
            return True
        except Exception as e:
            print(f"Error adding user scan history: {e}")
            return False

    def save_feedback(
        self,
        scan_id: str,
        helpful: bool,
        reason: Optional[str] = None,
        suggested_score: Optional[int] = None,
        comment: Optional[str] = None,
        user_id: Optional[str] = None,
        model_version: Optional[str] = None,
        ruleset_version: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Save scan result feedback.

        Args:
            scan_id: Extension/scan identifier (slug or ID)
            helpful: Whether the user found the result helpful
            reason: Reason for negative feedback (required if helpful=False)
            suggested_score: User's suggested score (0-100)
            comment: Optional comment (max 280 chars)
            user_id: Anonymous user identifier
            model_version: AI model version (future-proofing)
            ruleset_version: Ruleset version (future-proofing)

        Returns:
            The saved feedback record
        """
        try:
            now = datetime.now(timezone.utc).isoformat()
            row_id = str(uuid.uuid4())
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    INSERT INTO scan_feedback (
                        id, scan_id, helpful, reason, suggested_score, comment,
                        user_id, model_version, ruleset_version, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        row_id,
                        scan_id,
                        1 if helpful else 0,
                        reason,
                        suggested_score,
                        comment,
                        user_id,
                        model_version,
                        ruleset_version,
                        now,
                    ),
                )
            record = {
                "id": row_id,
                "scan_id": scan_id,
                "helpful": helpful,
                "reason": reason,
                "suggested_score": suggested_score,
                "comment": comment,
                "user_id": user_id,
                "model_version": model_version,
                "ruleset_version": ruleset_version,
                "created_at": now,
            }
            logger.info("Saved feedback for scan %s: helpful=%s, reason=%s", scan_id, helpful, reason)
            return record
        except Exception as e:
            logger.error("Error saving feedback: %s", e)
            raise

    def get_user_scan_history(self, user_id: str, limit: int = 50, private_only: bool = False) -> List[Dict[str, Any]]:
        """
        Get scan history for a single user, joined with global scan_results by extension_id.
        
        Args:
            user_id: User identifier
            limit: Max results to return
            private_only: If True, only return private uploads (source='upload')
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                base_query = """
                    SELECT
                        h.extension_id,
                        r.extension_name,
                        r.url,
                        r.timestamp,
                        r.status,
                        r.security_score,
                        r.risk_level,
                        r.total_findings,
                        r.total_files,
                        r.high_risk_count,
                        r.medium_risk_count,
                        r.low_risk_count,
                        r.visibility,
                        r.source
                    FROM user_scan_history h
                    LEFT JOIN scan_results r
                        ON r.extension_id = h.extension_id
                    WHERE h.user_id = ?
                """
                if private_only:
                    base_query += " AND r.source = 'upload'"
                base_query += " ORDER BY COALESCE(h.last_viewed_at, h.created_at) DESC LIMIT ?"
                
                cursor.execute(base_query, (user_id, limit))
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error getting user scan history: {e}")
            return []

    def get_scan_result(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Get scan result by extension ID or slug. Identifier can be 32-char extension ID, upload UUID, or name slug."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                # Always try extension_id first (Chrome ID or upload UUID)
                cursor.execute("SELECT * FROM scan_results WHERE extension_id = ?", (identifier,))
                row = cursor.fetchone()
                if not row and not _is_extension_id(identifier):
                    # Fall back to slug for human-readable names
                    cursor.execute(
                        """SELECT * FROM scan_results WHERE slug = ? ORDER BY timestamp DESC LIMIT 1""",
                        (identifier,),
                    )
                    row = cursor.fetchone()
                if not row:
                    return None
                return self._row_to_dict(row)
        except Exception as e:
            print(f"Error getting scan result: {e}")
            return None

    def get_scan_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get scan history ordered by most recent."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT 
                        extension_id, extension_name, url, timestamp, status,
                        security_score, risk_level, total_findings, total_files,
                        high_risk_count, medium_risk_count, low_risk_count
                    FROM scan_results
                    ORDER BY timestamp DESC
                    LIMIT ?
                """,
                    (limit,),
                )

                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            print(f"Error getting scan history: {e}")
            return []

    def get_statistics(self) -> Dict[str, int]:
        """Get aggregated statistics."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Get basic stats from statistics table
                cursor.execute("SELECT metric_name, metric_value FROM statistics")
                stats = {row["metric_name"]: row["metric_value"] for row in cursor.fetchall()}

                # Get additional computed stats
                cursor.execute(
                    """
                    SELECT 
                        COUNT(*) as total_scans,
                        SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high_risk,
                        SUM(total_files) as total_files,
                        SUM(total_findings) as total_findings,
                        AVG(security_score) as avg_security_score
                    FROM scan_results
                    WHERE status = 'completed'
                """
                )

                row = cursor.fetchone()
                if row:
                    stats.update(
                        {
                            "total_scans": row["total_scans"] or 0,
                            "high_risk_extensions": row["high_risk"] or 0,
                            "total_files_analyzed": row["total_files"] or 0,
                            "total_vulnerabilities": row["total_findings"] or 0,
                            "avg_security_score": int(row["avg_security_score"] or 0),
                        }
                    )

                return stats
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return {
                "total_scans": 0,
                "high_risk_extensions": 0,
                "total_files_analyzed": 0,
                "total_vulnerabilities": 0,
                "avg_security_score": 0,
            }

    def get_risk_distribution(self) -> Dict[str, int]:
        """Get distribution of risk levels."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    SELECT 
                        risk_level,
                        COUNT(*) as count
                    FROM scan_results
                    WHERE status = 'completed'
                    GROUP BY risk_level
                """
                )

                distribution = {"high": 0, "medium": 0, "low": 0}
                for row in cursor.fetchall():
                    risk_level = row["risk_level"]
                    if risk_level in distribution:
                        distribution[risk_level] = row["count"]

                return distribution
        except Exception as e:
            print(f"Error getting risk distribution: {e}")
            return {"high": 0, "medium": 0, "low": 0}

    def get_recent_scans(self, limit: int = 10, search: Optional[str] = None, include_all: bool = False) -> List[Dict[str, Any]]:
        """Get recent scans with summary info including metadata and signal data to avoid N+1 queries.
        Optional search filters by extension_name or extension_id (case-insensitive).
        When search is provided, results are ranked by relevance: exact title match first, then title
        starts with, then title contains (e.g. "block" matches "Paypal ad blocker"), then ID match; then by recency.
        When include_all=True, returns all completed scans regardless of visibility/source (for QA export).
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                if search and search.strip():
                    term_raw = search.strip()
                    term = f"%{term_raw}%"
                    visibility_filter = "" if include_all else " AND COALESCE(visibility, 'public') = 'public' AND COALESCE(source, 'webstore') = 'webstore'"
                    cursor.execute(
                        """
                        SELECT 
                            extension_id, extension_name, slug, url, timestamp,
                            security_score, risk_level, total_findings,
                            total_files, metadata, 
                            sast_results, permissions_analysis, manifest, 
                            webstore_analysis, summary,
                            icon_base64, icon_media_type
                        FROM scan_results
                        WHERE status = 'completed'
                          """ + visibility_filter + """
                          AND (extension_name LIKE ? OR extension_id LIKE ?)
                        ORDER BY
                          CASE
                            WHEN LOWER(TRIM(extension_name)) = LOWER(?) THEN 0
                            WHEN LOWER(extension_name) LIKE LOWER(?) || '%' THEN 1
                            WHEN LOWER(extension_name) LIKE '%' || LOWER(?) || '%' THEN 2
                            WHEN extension_id LIKE ? THEN 3
                            ELSE 4
                          END,
                          COALESCE(updated_at, timestamp) DESC
                        LIMIT ?
                    """,
                        (term, term, term_raw, term_raw, term_raw, term, limit),
                    )
                else:
                    visibility_filter = "" if include_all else " AND COALESCE(visibility, 'public') = 'public' AND COALESCE(source, 'webstore') = 'webstore'"
                    cursor.execute(
                        """
                        SELECT 
                            extension_id, extension_name, slug, url, timestamp,
                            security_score, risk_level, total_findings,
                            total_files, metadata, 
                            sast_results, permissions_analysis, manifest, 
                            webstore_analysis, summary,
                            icon_base64, icon_media_type
                        FROM scan_results
                        WHERE status = 'completed'
                          """ + visibility_filter + """
                        ORDER BY COALESCE(updated_at, timestamp) DESC
                        LIMIT ?
                    """,
                        (limit,),
                    )

                # Use _row_to_dict to parse JSON fields like metadata, sast_results, etc.
                rows = cursor.fetchall()
                result_rows = []
                for row in rows:
                    try:
                        row_dict = self._row_to_dict(row)
                        
                        # Extract modern fields from summary JSON if present (for signal calculation)
                        summary = row_dict.get("summary", {})
                        if isinstance(summary, dict):
                            if "scoring_v2" in summary:
                                row_dict["scoring_v2"] = summary.get("scoring_v2")
                            if "report_view_model" in summary:
                                row_dict["report_view_model"] = summary.get("report_view_model")
                            if "governance_bundle" in summary:
                                row_dict["governance_bundle"] = summary.get("governance_bundle")
                            if "virustotal_analysis" in summary:
                                row_dict["virustotal_analysis"] = summary.get("virustotal_analysis")
                        
                        result_rows.append(row_dict)
                    except Exception as row_error:
                        print(f"Error processing row in get_recent_scans: {row_error}")
                        # Continue processing other rows
                        continue
                
                print(f"[get_recent_scans] Retrieved {len(result_rows)} scans from database")
                return result_rows
        except Exception as e:
            import traceback
            print(f"Error getting recent scans: {e}")
            print(f"Traceback: {traceback.format_exc()}")
            return []

    def touch_scan_result(self, extension_id: str) -> bool:
        """Touch scan result to bump it in recent scans (updates updated_at)."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    UPDATE scan_results SET updated_at = datetime('now') WHERE extension_id = ?
                """,
                    (extension_id,),
                )
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error touching scan result: {e}")
            return False

    def update_scan_summary(self, extension_id: str, scoring_v2: dict, report_view_model: dict) -> bool:
        """
        Update the summary JSON field with upgraded scoring_v2 and report_view_model.
        Called after legacy payload upgrade to persist the computed data.
        """
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                # Get current summary
                cursor.execute(
                    "SELECT summary FROM scan_results WHERE extension_id = ?",
                    (extension_id,),
                )
                row = cursor.fetchone()
                if not row:
                    return False
                
                current_summary = row[0]
                if isinstance(current_summary, str):
                    try:
                        current_summary = json.loads(current_summary)
                    except Exception:
                        current_summary = {}
                if not isinstance(current_summary, dict):
                    current_summary = {}
                
                # Update with new fields
                if scoring_v2:
                    current_summary["scoring_v2"] = scoring_v2
                if report_view_model:
                    current_summary["report_view_model"] = report_view_model
                
                cursor.execute(
                    "UPDATE scan_results SET summary = ? WHERE extension_id = ?",
                    (json.dumps(current_summary), extension_id),
                )
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Error updating scan summary: {e}")
            return False

    def delete_scan_result(self, extension_id: str) -> bool:
        """Delete a scan result."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    """
                    DELETE FROM scan_results WHERE extension_id = ?
                """,
                    (extension_id,),
                )

                self._update_statistics()
                return True
        except Exception as e:
            print(f"Error deleting scan result: {e}")
            return False

    def clear_all_results(self) -> bool:
        """Clear all scan results."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM scan_results")
                self._update_statistics()
                return True
        except Exception as e:
            print(f"Error clearing results: {e}")
            return False

    def delete_scans_before(self, cutoff_iso: str) -> int:
        """Delete scan_results with timestamp strictly before cutoff (for cleanup). Returns count deleted."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "DELETE FROM scan_results WHERE timestamp < ?",
                    (cutoff_iso,),
                )
                n = cursor.rowcount
                self._update_statistics()
                return n
        except Exception as e:
            print(f"Error delete_scans_before: {e}")
            return 0

    def _update_statistics(self):
        """Update aggregated statistics."""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                # Update total scans
                cursor.execute(
                    """
                    UPDATE statistics 
                    SET metric_value = (
                        SELECT COUNT(*) FROM scan_results WHERE status = 'completed'
                    ),
                        updated_at = ?
                    WHERE metric_name = 'total_scans'
                """,
                    (datetime.now().isoformat(),),
                )

                # Update high risk count
                cursor.execute(
                    """
                    UPDATE statistics 
                    SET metric_value = (
                        SELECT COUNT(*) FROM scan_results 
                        WHERE status = 'completed' AND risk_level = 'high'
                    ),
                    updated_at = ?
                    WHERE metric_name = 'high_risk_extensions'
                """,
                    (datetime.now().isoformat(),),
                )

                # Update total files
                cursor.execute(
                    """
                    UPDATE statistics 
                    SET metric_value = (
                        SELECT COALESCE(SUM(total_files), 0) FROM scan_results 
                        WHERE status = 'completed'
                    ),
                    updated_at = ?
                    WHERE metric_name = 'total_files_analyzed'
                """,
                    (datetime.now().isoformat(),),
                )

                # Update total vulnerabilities
                cursor.execute(
                    """
                    UPDATE statistics 
                    SET metric_value = (
                        SELECT COALESCE(SUM(total_findings), 0) FROM scan_results 
                        WHERE status = 'completed'
                    ),
                    updated_at = ?
                    WHERE metric_name = 'total_vulnerabilities'
                """,
                    (datetime.now().isoformat(),),
                )

        except Exception as e:
            print(f"Error updating statistics: {e}")

    def _row_to_dict(self, row: sqlite3.Row) -> Dict[str, Any]:
        """Convert database row to dictionary with JSON parsing."""
        result = dict(row)

        # Parse JSON fields
        json_fields = [
            "metadata",
            "manifest",
            "permissions_analysis",
            "sast_results",
            "webstore_analysis",
            "summary",
            "extracted_files",
        ]

        for field in json_fields:
            if result.get(field):
                try:
                    result[field] = json.loads(result[field])
                except json.JSONDecodeError:
                    result[field] = {}

        return result


