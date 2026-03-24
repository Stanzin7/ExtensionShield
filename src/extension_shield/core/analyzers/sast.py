"""Static Application Security Testing (SAST) Analyzer"""

import json
import logging
import re
from typing import Dict, Optional, List
import subprocess
import os
import fnmatch
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from extension_shield.core.analyzers import BaseAnalyzer

load_dotenv()
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.DEBUG,  # or INFO
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
SUSPICIOUS_PATTERNS = [
    # 🌐 Network calls
    (r'fetch\s*\(', "network_call"),
    (r'XMLHttpRequest', "network_call"),
    (r'axios\.', "network_call"),
    (r'WebSocket', "network_call"),

    # 🍪 Sensitive data
    (r'chrome\.cookies', "cookie_access"),
    (r'document\.cookie', "cookie_access"),
    (r'localStorage', "local_storage"),
    (r'sessionStorage', "session_storage"),

    # 🔐 Credential / token
    (r'Authorization', "auth_token"),
    (r'Bearer\s+[A-Za-z0-9\-_\.]+', "token"),

    # ⚠️ Dangerous
    (r'eval\s*\(', "eval_usage"),
    (r'new Function\(', "dynamic_code"),
    (r'atob\s*\(', "base64_decode"),

    # 🧠 Obfuscation
    (r'\\x[0-9a-fA-F]{2}', "hex_obfuscation"),
]
class JavaScriptAnalyzer(BaseAnalyzer):
    """Analyzes JavaScript files in Chrome extensions using SAST techniques."""

    def __init__(self):
        """Initialize the JavaScriptAnalyzer."""
        super().__init__(name="JavaScriptAnalyzer")
        self.sast_config = self._load_sast_config()
        self.semgrep_config = self._get_semgrep_config()

    @staticmethod
    def _load_sast_config() -> Dict:
        """Load SAST configuration from JSON file."""
        config_path = Path(__file__).parent.parent.parent / "config" / "sast_config.json"
        try:
            with open(config_path, "r", encoding="utf-8") as file:
                config = json.load(file)
                logger.info("Loaded SAST configuration from %s", config_path)
                 # --- ADDED PRINT HERE ---
                print(f"\n--- SUCCESS: SAST Config Loaded from {config_path} ---")
                print(config)
                print("---------------------------------------------------\n")
                
                return config
        except FileNotFoundError:
            logger.warning("SAST config file not found at %s, using default settings", config_path)
            return {"enabled": False, "exclusion_patterns": {}, "max_file_size_kb": 500}
        except json.JSONDecodeError as exc:
            logger.error("Error parsing SAST config file: %s", exc)
            return {"enabled": False, "exclusion_patterns": {}, "max_file_size_kb": 500}

    def _regex_scan(self, file_path):
            findings = []

            try:
                with open(file_path, "r", errors="ignore") as f:
                    content = f.read()

                for pattern, category in SUSPICIOUS_PATTERNS:
                    matches = re.findall(pattern, content)
                    if matches:
                        findings.append({
                            "type": category,
                            "severity": "medium",
                            "file": file_path,
                            "count": len(matches),
                        })

            except Exception as e:
                logger.warning("Regex scan failed: %s", e)

            return findings
    def _partial_scan(self, file_path):
        try:
                with open(file_path, "r", errors="ignore") as f:
                    content = f.read(30000)

                findings = []
                for pattern, category in SUSPICIOUS_PATTERNS:
                    matches = re.findall(pattern, content)
                    if matches:
                        findings.append({
                            "type": category,
                            "severity": "medium",
                            "file": file_path,
                            "count": len(matches),
                        })

                return findings

        except Exception:
         return []
    def _get_semgrep_config(self) -> str:
            config_path = (
                Path(__file__).resolve().parents[1] / "semgrep_rules" / "chrome_extension_rules.yml"
                 )

            if config_path.exists():
                logger.info("Using custom Semgrep ruleset: %s", config_path)
                return str(config_path)

            logger.warning("Custom rules not found, fallback to default!")
            return "p/javascript"

    def _should_skip_file(self, file_path: str) -> tuple[bool, Optional[str]]:
        if not self.sast_config.get("enabled", True):
            return False, None

        file_name = file_path.split("/")[-1].lower()
        file_path_lower = file_path.lower()

        exclusion_patterns = self.sast_config.get("exclusion_patterns", {})

        # 🚫 ONLY skip truly useless directories
        HARD_SKIP_DIRS = ["node_modules", ".git", "dist/assets"]

        for segment in HARD_SKIP_DIRS:
            if f"/{segment}" in file_path_lower:
                return True, f"hard skip dir '{segment}'"

        # ⚠️ SOFT FILTER (do NOT skip)
        LOW_PRIORITY_PATTERNS = ["*.min.js", "*.bundle.js", "chunk-*.js"]

        for pattern in LOW_PRIORITY_PATTERNS:
            if fnmatch.fnmatch(file_name, pattern):
                return False, f"low_priority:{pattern}"

        # ⚠️ Libraries → still scan
        library_names = exclusion_patterns.get("library_names", [])
        for lib_name in library_names:
            if lib_name.lower() in file_name:
                return False, f"library:{lib_name}"

        # ⚠️ Large files → partial scan instead of skip
        max_size_kb = self.sast_config.get("max_file_size_kb", 2000)

        if os.path.exists(file_path):
            file_size_kb = os.path.getsize(file_path) / 1024
            if file_size_kb > max_size_kb:
                return False, f"large_file:{file_size_kb:.1f}KB"

        return False, None

    @staticmethod
    def _extract_javascript_files(extension_dir: str, manifest: Dict) -> List:
        """Extract JavaScript file paths from the extension manifest."""
        js_files = set()  # Use set for automatic deduplication

        # Background scripts
        if "background" in manifest:
            bg = manifest["background"]
            # Check if bg is not None and is a dict
            if bg and isinstance(bg, dict):
                # Manifest V3 uses service_worker
                if "service_worker" in bg:
                    js_files.add(bg["service_worker"])
                # Manifest V2 uses scripts array
                if "scripts" in bg:
                    js_files.update(bg["scripts"])
            # TODO: Handle scripts embedded in HTML if needed

        # Content scripts
        if "content_scripts" in manifest:
            for content_script in manifest["content_scripts"]:
                if "js" in content_script:
                    js_files.update(content_script["js"])

        # TODO: Handle other script locations like popup, options, etc.

        # Convert to absolute paths and sort for consistent ordering
        js_file_paths = sorted([f"{extension_dir}/{file_path}" for file_path in js_files])
        logger.info("Extracted %d unique JavaScript files from manifest", len(js_file_paths))
        return js_file_paths

    @staticmethod
    def _is_semgrep_installed() -> bool:
        """Check if Semgrep is installed."""
        try:
            subprocess.run(["semgrep", "--version"], capture_output=True, text=True, check=True)
            return True
        except FileNotFoundError:
            logger.error(
                "Semgrep is not installed or not found in PATH. Install 'semgrep' python package."
            )
            return False

    @staticmethod
    def _run_semgrep_scan(file_path: str, config: str = "auto") -> Optional[Dict]:
        """Run Semgrep scan on a single JavaScript file."""
        try:
            cmd = [
                "semgrep",
                "--config",
                config,
                "--json",
                file_path,
            ]
            logger.info("Running SAST scan on file: %s with rule %s", file_path, config)

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout
                check=False,
            )

            if result.stdout:
                findings = json.loads(result.stdout)
                return findings
            logger.info("No findings from Semgrep scan on file: %s", file_path)
            return None

        except subprocess.TimeoutExpired:
            logger.error("Semgrep scan timed out for file: %s", file_path)
            return None
        except Exception as exc:
            logger.error("Error running Semgrep scan on file %s: %s", file_path, exc)
            return None

    @staticmethod
    def _get_relative_path(file_path: str, base_dir: str) -> str:
        """Get relative path from base directory."""
        if file_path.startswith(base_dir):
            # Remove base_dir and leading slash
            rel_path = file_path[len(base_dir) :].lstrip("/")
            return rel_path
        # Fallback to just filename if path doesn't start with base_dir
        return file_path.split("/")[-1]

    @staticmethod
    def _scan_file_for_third_party_api(file_path: str, extension_dir: str) -> Optional[Dict]:
        """
        Directly scan a file for third-party API calls using regex.

        This is a fallback when Semgrep pattern-regex doesn't work on minified code.
        Returns a finding dict if detected, None otherwise.
        """
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            pattern = r'fetch\s*\(\s*["\']https?://[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}[^\s"\'`)]*["\']'
            matches = list(re.finditer(pattern, content, re.IGNORECASE))

            for match in matches:
                url = match.group(0)
                # Exclude chrome://, chrome-extension://, localhost
                if (
                    "chrome://" not in url
                    and "chrome-extension://" not in url
                    and "localhost" not in url
                    and "127.0.0.1" not in url
                ):
                    line_num = content.count("\n", 0, match.start()) + 1
                    lines = content.split("\n")
                    rel_path = JavaScriptAnalyzer._get_relative_path(file_path, extension_dir)
                    return {
                        "check_id": "banking.third_party.external_api_calls",
                        "path": rel_path,
                        "start": {"line": line_num, "col": match.start()},
                        "end": {"line": line_num, "col": match.end()},
                        "extra": {
                            "severity": "ERROR",
                            "message": f"Third-party API call detected—extension communicating with external domains via fetch: {url[:80]}",
                            "metadata": {
                                "category": "third-party-api",
                                "mitre": ["T1041", "T1071"],
                                "owasp": [
                                    "A01-Broken Access Control",
                                    "A05-Security Misconfiguration",
                                ],
                            },
                            "lines": lines[line_num - 1][:200] if line_num <= len(lines) else "",
                        },
                    }
        except Exception as exc:
            logger.debug("Error in direct third-party scan for %s: %s", file_path, exc)
        return None

    @staticmethod
    def _run_semgrep_batch_scan(
        file_paths: List[str], extension_dir: str, config: str = "auto", timeout: int = 300
    ) -> Dict[str, List]:
        """Run Semgrep scan on multiple JavaScript files in a single batch."""
        if not file_paths:
            return {}

        try:
            cmd = [
                "semgrep",
                "--config",
                config,
                "--json",
                *file_paths,  # Pass all files to Semgrep
            ]
            logger.info("Running batch SAST scan on %d files with rule %s", len(file_paths), config)

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                # Don't raise on non-zero exit (Semgrep returns non-zero if findings)
                check=False,
            )

            if result.stdout:
                findings_data = json.loads(result.stdout)

                # Map findings back to individual files using relative paths
                findings_by_file = {}
                for file_path in file_paths:
                    rel_path = JavaScriptAnalyzer._get_relative_path(file_path, extension_dir)
                    findings_by_file[rel_path] = []

                if "results" in findings_data:
                    for finding in findings_data["results"]:
                        if "path" in finding:
                            rel_path = JavaScriptAnalyzer._get_relative_path(
                                finding["path"], extension_dir
                            )
                            if rel_path in findings_by_file:
                                findings_by_file[rel_path].append(finding)

                # Fallback: If no third-party API findings detected, scan files directly
                # This handles cases where Semgrep pattern-regex doesn't work on minified code
                third_party_found = any(
                    "third_party" in f.get("check_id", "").lower()
                    or "external_api" in f.get("check_id", "").lower()
                    for findings_list in findings_by_file.values()
                    for f in findings_list
                )

                if not third_party_found:
                    # Only add ONE finding total, not one per file
                    for file_path in file_paths:
                        rel_path = JavaScriptAnalyzer._get_relative_path(file_path, extension_dir)
                        finding = JavaScriptAnalyzer._scan_file_for_third_party_api(
                            file_path, extension_dir
                        )
                        if finding:
                            if rel_path not in findings_by_file:
                                findings_by_file[rel_path] = []
                            findings_by_file[rel_path].append(finding)
                            logger.debug("Fallback scan found third-party API in %s", rel_path)
                            break  # Only add ONE finding per analysis, not per file

                logger.info(
                    "Batch scan completed: found findings in %d/%d files",
                    sum(1 for f in findings_by_file.values() if f),
                    len(file_paths),
                )
                return findings_by_file
            logger.info("No findings from batch Semgrep scan")
            return {
                JavaScriptAnalyzer._get_relative_path(fp, extension_dir): [] for fp in file_paths
            }

        except subprocess.TimeoutExpired:
            logger.error(
                "Batch Semgrep scan timed out after %d seconds for %d files",
                timeout,
                len(file_paths),
            )
            return {}
        except Exception as exc:
            logger.error("Error running batch Semgrep scan: %s", exc)
            return {}

    def _run_parallel_batch_scans(
        self, file_paths: List[str], extension_dir: str, config: str = "auto", max_workers: int = 4
    ) -> Dict[str, List]:
        """Run Semgrep scans on files in parallel batches."""
        if not file_paths:
            return {}

        # Calculate timeout per batch based on files per batch
        scanning_config = self.sast_config.get("scanning", {})
        timeout_per_file = scanning_config.get("batch_timeout_per_file_seconds", 10)

        # Split files into batches for parallel processing
        batch_size = max(1, len(file_paths) // max_workers)
        batches = [file_paths[i : i + batch_size] for i in range(0, len(file_paths), batch_size)]

        logger.info(
            "Splitting %d files into %d batches for parallel scanning",
            len(file_paths),
            len(batches),
        )

        all_findings = {}

        # Run batches in parallel
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all batches
            future_to_batch = {
                executor.submit(
                    self._run_semgrep_batch_scan,
                    batch,
                    extension_dir,
                    config,
                    len(batch) * timeout_per_file + 60,  # Timeout per batch
                ): batch
                for batch in batches
            }

            # Collect results as they complete
            for future in as_completed(future_to_batch):
                batch = future_to_batch[future]
                try:
                    batch_findings = future.result()
                    all_findings.update(batch_findings)
                    logger.info("Completed parallel batch scan of %d files", len(batch))
                except Exception as exc:
                    logger.error(
                        "Parallel batch scan failed for batch of %d files: %s", len(batch), exc
                    )

        # Fallback: Check if third-party API was detected, if not scan directly
        third_party_found = any(
            "third_party" in f.get("check_id", "").lower()
            or "external_api" in f.get("check_id", "").lower()
            for findings_list in all_findings.values()
            for f in findings_list
        )

        if not third_party_found:
            # Only add ONE finding total, not one per file
            for file_path in file_paths:
                rel_path = self._get_relative_path(file_path, extension_dir)
                finding = self._scan_file_for_third_party_api(file_path, extension_dir)
                if finding:
                    if rel_path not in all_findings:
                        all_findings[rel_path] = []
                    all_findings[rel_path].append(finding)
                    logger.debug("Fallback scan found third-party API in %s", rel_path)
                    break  # Only add ONE finding per analysis, not per file

        return all_findings

    def _filter_files(
            self, file_paths: List[str], extension_dir: str
        ) -> tuple[List[Dict], List[Dict]]:
            """
            Returns:
                files_to_scan: [{path, reason}]
                skipped_files: [{file, reason}]
            """
            files_to_scan = []
            skipped_files = []

            for file_path in file_paths:
                should_skip, reason = self._should_skip_file(file_path)
                rel_path = self._get_relative_path(file_path, extension_dir)

                if should_skip:
                    skipped_files.append({"file": rel_path, "reason": reason})
                    continue

                files_to_scan.append({
                    "path": file_path,
                    "reason": reason
                })

            logger.info(
                "Filtered %d JS files → %d to scan, %d skipped",
                len(file_paths),
                len(files_to_scan),
                len(skipped_files),
            )

            return files_to_scan, skipped_files

    @staticmethod
    def _aggregate_findings(all_findings: Dict[str, List]) -> Dict:
        """
        Aggregate SAST findings by severity and count.

        Also filters third-party API findings to exclude chrome://, chrome-extension://,
        and localhost (Semgrep pattern-regex has limited regex support).
        """
        severity_counts = {"CRITICAL": 0, "ERROR": 0, "WARNING": 0, "INFO": 0}
        total_findings = 0
        files_with_findings = set()
        excluded_patterns = [
            "chrome://",
            "chrome-extension://",
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
        ]

        for file_path, findings in all_findings.items():
            if findings:
                # Filter third-party API findings to remove false positives from pattern-regex
                filtered_findings = []
                for finding in findings:
                    check_id = finding.get("check_id", "")
                    if "third_party" in check_id.lower() or "external_api" in check_id.lower():
                        # Check if this is a false positive (chrome://, localhost, etc.)
                        message = finding.get("extra", {}).get("message", "")
                        lines = finding.get("extra", {}).get("lines", "")
                        should_exclude = any(
                            pattern in message.lower() or pattern in lines.lower()
                            for pattern in excluded_patterns
                        )
                        if not should_exclude:
                            filtered_findings.append(finding)
                    else:
                        filtered_findings.append(finding)
                all_findings[file_path] = filtered_findings
                findings = filtered_findings

            if findings:
                files_with_findings.add(file_path)
                for finding in findings:
                    total_findings += 1
                    severity = finding.get("extra", {}).get("severity", "INFO")
                    if severity in severity_counts:
                        severity_counts[severity] += 1
                    else:
                        # Handle unknown severity as WARNING
                        severity_counts["WARNING"] += 1

        return {
            "total_findings": total_findings,
            "by_severity": severity_counts,
            "files_with_findings": len(files_with_findings),
        }

    @staticmethod
    def _format_findings_for_llm(all_findings: Dict[str, List], top_n: int = 10) -> str:
        """Format top N findings for LLM prompt."""
        # Flatten all findings with file context
        formatted_findings = []

        for file_path, findings in all_findings.items():
            for finding in findings:
                severity = finding.get("extra", {}).get("severity", "INFO")
                message = finding.get("extra", {}).get("message", "No message")
                line = finding.get("start", {}).get("line", "?")
                category = finding.get("extra", {}).get("metadata", {}).get("category", "unknown")

                formatted_findings.append(
                    {
                        "severity": severity,
                        "file": file_path,
                        "line": line,
                        "message": message,
                        "category": category,
                    }
                )

        # Sort by severity priority (CRITICAL > ERROR > WARNING > INFO)
        severity_order = {"CRITICAL": 0, "ERROR": 1, "WARNING": 2, "INFO": 3}
        formatted_findings.sort(key=lambda x: severity_order.get(x["severity"], 4))

        # Take top N and format as text
        top_findings = formatted_findings[:top_n]
        if not top_findings:
            return "No findings detected."

        findings_text = []
        for finding in top_findings:
            findings_text.append(
                f"{finding['file']}:{finding['line']} - "
                f"[{finding['severity']}] {finding['message']} (category: {finding['category']})"
            )

        return "\n".join(findings_text)

    def _summarize_sast_findings(
        self, all_findings: Dict[str, List], files_scanned: int, metadata: Optional[Dict] = None
    ) -> Optional[str]:
        """Generate LLM-based summary of SAST findings."""
        from extension_shield.llm.prompts import get_prompts
        from extension_shield.llm.clients.fallback import invoke_with_fallback
        from langchain_core.prompts import PromptTemplate

        try:
            # Aggregate findings
            stats = self._aggregate_findings(all_findings)

            # If no findings, return simple message
            if stats["total_findings"] == 0:
                return "[RISK: LOW] No security findings detected in SAST analysis."

            # Format findings for LLM
            findings_details = self._format_findings_for_llm(all_findings, top_n=10)

            # Get extension name from metadata
            extension_name = "Unknown Extension"
            if metadata:
                extension_name = metadata.get("name", "Unknown Extension")

            # Load prompt
            prompts = get_prompts("sast_analysis.yaml")
            template = PromptTemplate.from_template(prompts["sast_analysis_prompt"])

            # Get LLM configuration
            model_name = os.getenv("LLM_MODEL", "meta-llama/llama-3-3-70b-instruct")
            model_parameters = {"max_tokens": 500, "temperature": 0.1}

            # Format prompt to messages
            formatted_prompt = template.format_prompt(
                {
                    "extension_name": extension_name,
                    "files_scanned": files_scanned,
                    "files_with_findings": stats["files_with_findings"],
                    "critical_count": stats["by_severity"]["CRITICAL"],
                    "error_count": stats["by_severity"]["ERROR"],
                    "warning_count": stats["by_severity"]["WARNING"],
                    "info_count": stats["by_severity"]["INFO"],
                    "findings_details": findings_details,
                }
            )
            messages = formatted_prompt.to_messages()

            # Invoke with fallback
            response = invoke_with_fallback(
                messages=messages,
                model_name=model_name,
                model_parameters=model_parameters,
            )

            # Parse string response
            summary = response.content if hasattr(response, "content") else str(response)

            logger.info("Generated SAST summary with LLM")
            return summary.strip()

        except Exception as exc:
            logger.error("Error generating SAST summary: %s", exc)
            return None
# //Run main scanner in parralelel batches for better performance, with fallback to direct regex scan for third-party API calls if pattern-regex doesn't work on minified code
    def analyze(
            self,
            extension_dir: str,
            manifest: Optional[Dict] = None,
            metadata: Optional[Dict] = None,
        ) -> Optional[Dict]:

            if manifest is None:
                return None

            if not self._is_semgrep_installed():
                return None

            js_files = self._extract_javascript_files(extension_dir, manifest)
            files_to_scan, _ = self._filter_files(js_files, extension_dir)

            if not files_to_scan:
                logger.info("No files to scan after filtering")
                return {"sast_findings": {}}

            all_findings = {}

            logger.info("Starting hybrid SAST scan on %d files", len(files_to_scan))

            for file in files_to_scan:
                file_path = file["path"]
                reason = file.get("reason")

                rel_path = self._get_relative_path(file_path, extension_dir)

                try:
                    #  HYBRID STRATEGY
                    if reason and "low_priority" in reason:
                        logger.info("[SAST] Regex scan → %s (%s)", rel_path, reason)
                        findings = self._regex_scan(file_path)

                    elif reason and "large_file" in reason:
                        logger.info("[SAST] Partial scan → %s (%s)", rel_path, reason)
                        findings = self._partial_scan(file_path)

                    else:
                        logger.info("[SAST] Semgrep scan → %s", rel_path)
                        result = self._run_semgrep_scan(file_path, self.semgrep_config)
                        findings = result.get("results", []) if result else []

                    # Normalize empty
                    if not findings:
                        findings = []

                    all_findings[rel_path] = findings

                    #  DEBUG LOG
                    logger.info(
                        "[SAST RESULT] %s → %d findings",
                        rel_path,
                        len(findings),
                    )

                except Exception as e:
                    logger.error("[SAST ERROR] Failed scanning %s: %s", rel_path, e)
                    all_findings[rel_path] = []

            # =========================================================
            # 🔥 FALLBACK: third-party API detection
            # =========================================================
            third_party_found = any(
                "third_party" in f.get("check_id", "").lower()
                or "external_api" in f.get("check_id", "").lower()
                for findings_list in all_findings.values()
                for f in findings_list
            )

            if not third_party_found:
                logger.info("[SAST] Running fallback API detection")

                for file in files_to_scan:
                    file_path = file["path"]
                    rel_path = self._get_relative_path(file_path, extension_dir)

                    finding = self._scan_file_for_third_party_api(file_path, extension_dir)
                    if finding:
                        all_findings.setdefault(rel_path, []).append(finding)

                        logger.info(
                            "[SAST FALLBACK] Found external API in %s",
                            rel_path,
                        )
                        break

            # =========================================================
            # 🔥 SUMMARY LOG
            # =========================================================
            total_files = len(all_findings)
            total_findings = sum(len(v) for v in all_findings.values())

            logger.info(
                "[SAST SUMMARY] Files scanned: %d | Total findings: %d",
                total_files,
                total_findings,
            )

            # =========================================================
            # LLM summary
            # =========================================================
            sast_analysis = self._summarize_sast_findings(
                all_findings=all_findings,
                files_scanned=total_files,
                metadata=metadata,
            )
            print(f"SAST Analysis Summary:\n{sast_analysis}")
            print(f"SAST Findings:\n{json.dumps(all_findings, indent=2)}")
            return {
                "sast_analysis": sast_analysis,
                "sast_findings": all_findings,
            }
