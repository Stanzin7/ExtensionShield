"""
Regression tests for the rules-engine DSL operator-splitting fix (audit finding #1).

The historical bug: ``_split_on_operator`` matched ``OR`` / ``AND`` as bare
substrings, so it split inside quoted signal names and larger words — e.g. the
``OR`` in ``type="COMPETITOR_SABOTAGE"`` or the domain ``"*.NORTON.com"`` — which
raised a parse error that was caught and silently downgraded an intended BLOCK
rule to NEEDS_REVIEW (and meant the condition never actually evaluated).

These tests pin:
1. Operators are only split as standalone, unquoted, top-level tokens.
2. The exact COMPETITOR_SABOTAGE case from the audit evaluates correctly.
3. A BLOCK rule referencing such a value still BLOCKs when its signal is present.
4. validate_rulepack rejects unevaluable conditions instead of degrading them.
5. The shipped rulepacks all load cleanly under the stricter validation.
"""

from pathlib import Path

import pytest

from extension_shield.governance.rules_engine import (
    ConditionEvaluator,
    RuleConditionError,
    RulesEngine,
    validate_rulepack,
)

RULEPACKS_DIR = Path(__file__).resolve().parents[2] / "src" / "extension_shield" / "governance" / "rulepacks"


def _sig(t):
    return [{"type": t}]


# =============================================================================
# Operator splitting: words and quoted strings must not be split
# =============================================================================

class TestOperatorSplitting:
    def test_or_inside_quoted_signal_name_not_split(self):
        """'OR' inside the quoted value COMPETITOR_SABOTAGE must not split."""
        ev = ConditionEvaluator()
        cond = 'signals contains type="COMPETITOR_SABOTAGE"'
        # Present -> True (rule would fire), absent -> False. Never raises.
        assert ev.evaluate(cond, {"signals": _sig("COMPETITOR_SABOTAGE")}) is True
        assert ev.evaluate(cond, {"signals": _sig("SOMETHING_ELSE")}) is False
        assert ev.evaluate(cond, {}) is False

    def test_or_inside_quoted_domain_not_split(self):
        """The 'OR' in NORTON (*.NORTON.com) must not split the expression."""
        ev = ConditionEvaluator()
        cond = 'facts.host_access_patterns contains "*.NORTON.com"'
        assert ev.evaluate(cond, {"facts": {"host_access_patterns": ["*.NORTON.com"]}}) is True
        assert ev.evaluate(cond, {"facts": {"host_access_patterns": ["*.example.com"]}}) is False

    def test_and_inside_quoted_value_not_split(self):
        """'AND' inside a quoted value (e.g. BRAND) must not split."""
        ev = ConditionEvaluator()
        cond = 'manifest.name contains "BRAND_GUARD"'
        assert ev.evaluate(cond, {"manifest": {"name": "BRAND_GUARD"}}) is True
        assert ev.evaluate(cond, {"manifest": {"name": "other"}}) is False

    def test_real_top_level_or_still_splits(self):
        ev = ConditionEvaluator()
        cond = 'manifest.permissions contains "tabs" OR manifest.permissions contains "cookies"'
        assert ev.evaluate(cond, {"manifest": {"permissions": ["cookies"]}}) is True
        assert ev.evaluate(cond, {"manifest": {"permissions": ["storage"]}}) is False

    def test_real_top_level_and_still_splits(self):
        ev = ConditionEvaluator()
        cond = 'manifest.permissions contains "tabs" AND manifest.permissions contains "cookies"'
        assert ev.evaluate(cond, {"manifest": {"permissions": ["tabs", "cookies"]}}) is True
        assert ev.evaluate(cond, {"manifest": {"permissions": ["tabs"]}}) is False

    def test_nested_paren_or_inside_and(self):
        """Mirrors PROTECTED_SERVICE_AUTOMATION::R1 shape."""
        ev = ConditionEvaluator()
        cond = (
            'signals contains type="PROTECTED_SERVICE_AUTOMATION" AND '
            '(signals contains type="CREDENTIAL_CAPTURE" OR '
            'signals contains type="IDENTITY_DATA_EXFIL")'
        )
        assert ev.evaluate(cond, {"signals": [
            {"type": "PROTECTED_SERVICE_AUTOMATION"}, {"type": "IDENTITY_DATA_EXFIL"}]}) is True
        # automation but no capture/exfil -> False
        assert ev.evaluate(cond, {"signals": [{"type": "PROTECTED_SERVICE_AUTOMATION"}]}) is False


# =============================================================================
# A BLOCK rule whose value contains 'OR'/'AND' must still BLOCK
# =============================================================================

class TestBlockRuleWithOperatorishValue:
    def test_block_rule_referencing_competitor_sabotage_blocks(self):
        """If a BLOCK rule keys on COMPETITOR_SABOTAGE it must BLOCK, not degrade."""
        rulepack = {
            "rulepack_id": "RP",
            "rules": [{
                "rule_id": "RP::SABOTAGE",
                "condition": 'signals contains type="COMPETITOR_SABOTAGE"',
                "verdict": "BLOCK",
                "confidence": 0.9,
            }],
        }
        # validation must accept it
        assert validate_rulepack(rulepack) == []
        engine = RulesEngine([rulepack])
        results = engine.evaluate(
            scan_id="s1",
            facts={},
            signals=[{"type": "COMPETITOR_SABOTAGE"}],
            store_listing={},
            context={"rulepacks": ["RP"]},
        )
        verdicts = {r.verdict for r in results.rule_results}
        assert "BLOCK" in verdicts, f"expected BLOCK, got {verdicts}"

    def test_same_rule_allows_when_signal_absent(self):
        rulepack = {
            "rulepack_id": "RP",
            "rules": [{
                "rule_id": "RP::SABOTAGE",
                "condition": 'signals contains type="COMPETITOR_SABOTAGE"',
                "verdict": "BLOCK",
                "confidence": 0.9,
            }],
        }
        engine = RulesEngine([rulepack])
        results = engine.evaluate(
            scan_id="s1", facts={}, signals=[{"type": "OTHER"}],
            store_listing={}, context={"rulepacks": ["RP"]},
        )
        # Rule did not match -> ALLOW (condition genuinely false, not an error)
        assert all(r.verdict == "ALLOW" for r in results.rule_results)


# =============================================================================
# Validation rejects unevaluable conditions
# =============================================================================

class TestValidationRejectsUnevaluable:
    def test_unknown_operator_condition_fails_validation(self):
        rp = {"rulepack_id": "RP", "rules": [{
            "rule_id": "RP::BAD",
            "condition": "facts.x TOTALLY INVALID syntax",
            "verdict": "BLOCK",
            "confidence": 0.9,
        }]}
        errors = validate_rulepack(rp)
        assert any("unevaluable" in e for e in errors), errors

    def test_malformed_branch_in_and_fails_validation(self):
        """Eager eval: a broken branch is caught even if the first branch is false."""
        rp = {"rulepack_id": "RP", "rules": [{
            "rule_id": "RP::BAD2",
            "condition": 'manifest.permissions contains "tabs" AND facts.y WHAT 3',
            "verdict": "BLOCK",
            "confidence": 0.9,
        }]}
        errors = validate_rulepack(rp)
        assert any("unevaluable" in e for e in errors), errors

    def test_valid_condition_passes_validation(self):
        rp = {"rulepack_id": "RP", "rules": [{
            "rule_id": "RP::OK",
            "condition": 'signals contains type="COMPETITOR_SABOTAGE" OR manifest.permissions contains "tabs"',
            "verdict": "NEEDS_REVIEW",
            "confidence": 0.7,
        }]}
        assert validate_rulepack(rp) == []


# =============================================================================
# Shipped rulepacks must still load cleanly under stricter validation
# =============================================================================

class TestShippedRulepacksLoad:
    def test_all_shipped_rulepacks_load_without_errors(self):
        rulepacks, errors = RulesEngine.load_rulepacks_with_report(str(RULEPACKS_DIR))
        assert errors == [], f"shipped rulepacks failed validation: {errors}"
        assert len(rulepacks) >= 3
        ids = {rp.get("rulepack_id") for rp in rulepacks}
        assert "PROTECTED_SERVICE_AUTOMATION" in ids
