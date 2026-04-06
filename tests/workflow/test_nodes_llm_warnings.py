"""
Tests for LLM-failure warning accumulation in workflow nodes.

Verifies that summary_generation_node, impact_analysis_node, and
privacy_compliance_node each append a human-readable warning to the
`llm_warnings` state key when the underlying LLM call raises an exception,
so that partial failures are surfaced to the user via the API response.
"""

import pytest
from unittest.mock import patch, MagicMock

from extension_shield.workflow.nodes import (
    summary_generation_node,
    impact_analysis_node,
    privacy_compliance_node,
)


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def base_state():
    """Minimal workflow state shared across LLM node tests."""
    return {
        "workflow_id": "test-scan-001",
        "extension_id": "abcdefghijklmnopabcdefghijklmnop",
        "manifest_data": {
            "name": "Test Extension",
            "version": "1.0.0",
            "manifest_version": 3,
            "permissions": ["storage"],
        },
        "analysis_results": {
            "permissions_analysis": {"permissions": ["storage"]},
        },
        "extension_metadata": {"title": "Test Extension"},
        "extension_dir": "/tmp/test_ext",
        "llm_warnings": None,
    }


# ---------------------------------------------------------------------------
# summary_generation_node
# ---------------------------------------------------------------------------

class TestSummaryGenerationNodeWarnings:
    """LLM failure warnings for summary_generation_node."""

    def test_no_warning_on_success(self, base_state):
        """When summary generation succeeds, no warning is added."""
        mock_summary = {"one_liner": "Safe extension", "summary": "All good."}

        with patch(
            "extension_shield.workflow.nodes.SummaryGenerator"
        ) as MockGen:
            MockGen.return_value.generate.return_value = mock_summary
            cmd = summary_generation_node(base_state)

        assert cmd.update.get("executive_summary") == mock_summary
        assert cmd.update.get("llm_warnings") == []

    def test_warning_added_on_generic_exception(self, base_state):
        """When summary generation raises a generic exception, a warning is appended."""
        with patch(
            "extension_shield.workflow.nodes.SummaryGenerator"
        ) as MockGen:
            MockGen.return_value.generate.side_effect = RuntimeError("timeout")
            cmd = summary_generation_node(base_state)

        assert cmd.update.get("executive_summary") is None
        warnings = cmd.update.get("llm_warnings", [])
        assert len(warnings) == 1
        assert "Summary unavailable" in warnings[0]
        assert "LLM service" in warnings[0]

    def test_warning_added_on_llm_fallback_error(self, base_state):
        """When LLMFallbackError is raised, the same warning is appended."""
        from extension_shield.llm.clients.fallback import LLMFallbackError

        with patch(
            "extension_shield.workflow.nodes.SummaryGenerator"
        ) as MockGen:
            MockGen.return_value.generate.side_effect = LLMFallbackError(
                {"groq": "timeout", "openai": "rate limit"}
            )
            cmd = summary_generation_node(base_state)

        assert cmd.update.get("executive_summary") is None
        warnings = cmd.update.get("llm_warnings", [])
        assert any("Summary unavailable" in w for w in warnings)

    def test_warning_accumulates_with_existing_warnings(self, base_state):
        """Warnings from prior nodes are preserved when summary also fails."""
        base_state["llm_warnings"] = ["Impact analysis unavailable — LLM service temporarily failed"]

        with patch(
            "extension_shield.workflow.nodes.SummaryGenerator"
        ) as MockGen:
            MockGen.return_value.generate.side_effect = RuntimeError("oops")
            cmd = summary_generation_node(base_state)

        warnings = cmd.update.get("llm_warnings", [])
        assert len(warnings) == 2
        assert any("Impact analysis" in w for w in warnings)
        assert any("Summary unavailable" in w for w in warnings)


# ---------------------------------------------------------------------------
# impact_analysis_node
# ---------------------------------------------------------------------------

class TestImpactAnalysisNodeWarnings:
    """LLM failure warnings for impact_analysis_node."""

    def test_no_warning_on_success(self, base_state):
        """When impact analysis succeeds, no warning is added."""
        mock_impact = {"buckets": []}

        with patch(
            "extension_shield.workflow.nodes.ImpactAnalyzer"
        ) as MockAnalyzer:
            MockAnalyzer.return_value.generate.return_value = mock_impact
            cmd = impact_analysis_node(base_state)

        assert cmd.update.get("impact_analysis") == mock_impact
        assert cmd.update.get("llm_warnings") == []

    def test_warning_added_on_exception(self, base_state):
        """When impact analysis raises an exception, a warning is appended."""
        with patch(
            "extension_shield.workflow.nodes.ImpactAnalyzer"
        ) as MockAnalyzer:
            MockAnalyzer.return_value.generate.side_effect = RuntimeError("error")
            cmd = impact_analysis_node(base_state)

        assert cmd.update.get("impact_analysis") is None
        warnings = cmd.update.get("llm_warnings", [])
        assert len(warnings) == 1
        assert "Impact analysis unavailable" in warnings[0]
        assert "LLM service" in warnings[0]


# ---------------------------------------------------------------------------
# privacy_compliance_node
# ---------------------------------------------------------------------------

class TestPrivacyComplianceNodeWarnings:
    """LLM failure warnings for privacy_compliance_node."""

    def test_no_warning_on_success(self, base_state):
        """When privacy compliance analysis succeeds, no warning is added."""
        mock_privacy = {"data_collection": "minimal"}

        with patch(
            "extension_shield.workflow.nodes.PrivacyComplianceAnalyzer"
        ) as MockAnalyzer:
            MockAnalyzer.return_value.generate.return_value = mock_privacy
            cmd = privacy_compliance_node(base_state)

        assert cmd.update.get("privacy_compliance") == mock_privacy
        assert cmd.update.get("llm_warnings") == []

    def test_warning_added_on_exception(self, base_state):
        """When privacy compliance analysis raises an exception, a warning is appended."""
        with patch(
            "extension_shield.workflow.nodes.PrivacyComplianceAnalyzer"
        ) as MockAnalyzer:
            MockAnalyzer.return_value.generate.side_effect = RuntimeError("error")
            cmd = privacy_compliance_node(base_state)

        assert cmd.update.get("privacy_compliance") is None
        warnings = cmd.update.get("llm_warnings", [])
        assert len(warnings) == 1
        assert "Privacy compliance unavailable" in warnings[0]
        assert "LLM service" in warnings[0]

    def test_warnings_accumulate_across_all_three_nodes(self, base_state):
        """All three LLM failures accumulate distinct warning messages."""
        # Simulate all three failing in sequence by pre-loading warnings
        base_state["llm_warnings"] = [
            "Summary unavailable — LLM service temporarily failed",
            "Impact analysis unavailable — LLM service temporarily failed",
        ]

        with patch(
            "extension_shield.workflow.nodes.PrivacyComplianceAnalyzer"
        ) as MockAnalyzer:
            MockAnalyzer.return_value.generate.side_effect = RuntimeError("error")
            cmd = privacy_compliance_node(base_state)

        warnings = cmd.update.get("llm_warnings", [])
        assert len(warnings) == 3
        messages = " ".join(warnings)
        assert "Summary" in messages
        assert "Impact analysis" in messages
        assert "Privacy compliance" in messages
