"""The scoring engine must reproduce the planning-doc numbers exactly."""
import itertools

import pytest

from app.core.config import standards, rule
from app.policy import scoring
from tests.conftest import findings_from_labels

ALL_COMPLIANT = {r["id"]: "Compliant" for r in standards()}


def test_standards_total_weight_is_35():
    assert sum(r["weight"] for r in standards()) == 35
    assert [r["id"] for r in standards()] == [f"P{i}" for i in range(1, 11)]


@pytest.mark.parametrize("contract_id", ["carewell", "northstar", "lexmore", "brightretail", "orbit"])
def test_golden_contracts_score_as_planned(golden, contract_id):
    c = next(c for c in golden["contracts"] if c["id"] == contract_id)
    result = scoring.compute(findings_from_labels(c["labels"]))
    assert result["score"] == c["expected_score"]
    assert result["band"] == c["expected_band"]


def test_floor_raises_brightretail_to_high():
    labels = {**ALL_COMPLIANT, "P1": "Missing", "P8": "Missing", "P10": "Missing", "P9": "Partial", "P2": "Silent (OK)"}
    result = scoring.compute(findings_from_labels(labels))
    assert result["raw_band"] == "Medium" and result["band"] == "High"
    assert result["floor_applied"] and result["floor_rules"] == ["P1"]


def test_na_is_removed_from_numerator_and_denominator():
    labels = {**ALL_COMPLIANT, "P3": "N/A"}
    assert scoring.compute(findings_from_labels(labels))["sum_w"] == 30


def test_needs_review_counts_as_worst_case():
    labels = {**ALL_COMPLIANT, "P9": scoring.NEEDS_REVIEW}
    assert scoring.compute(findings_from_labels(labels))["sum_wg"] == 2


def test_worse_status_never_lowers_score():
    order = ["Compliant", "Partial", "Conflicting"]
    for rule_id in ALL_COMPLIANT:
        scores = [scoring.compute(findings_from_labels({**ALL_COMPLIANT, rule_id: s}))["score"] for s in order]
        assert scores == sorted(scores)


def test_every_critical_missing_or_conflicting_is_at_least_high():
    critical = [r["id"] for r in standards() if r["critical"]]
    for rule_id, status in itertools.product(critical, ["Missing", "Conflicting"]):
        band = scoring.compute(findings_from_labels({**ALL_COMPLIANT, rule_id: status}))["band"]
        assert band in ("High", "Critical")


@pytest.mark.parametrize("rule_id,expected", [("P1", "Missing"), ("P7", "Missing"), ("P10", "Missing"),
                                              ("P2", "Silent (OK)"), ("P5", "Silent (OK)")])
def test_not_found_maps_by_if_silent(rule_id, expected):
    assert scoring.resolve_status("Not found", rule(rule_id)) == expected


def test_gate_triggers_on_conflicting_even_when_medium(golden):
    northstar = next(c for c in golden["contracts"] if c["id"] == "northstar")
    findings = findings_from_labels(northstar["labels"])
    result = scoring.compute(findings)
    assert result["band"] == "Medium"
    assert "P5 is Conflicting" in scoring.gate_reasons(findings, result)


def test_no_gate_for_clean_contract(golden):
    lexmore = next(c for c in golden["contracts"] if c["id"] == "lexmore")
    findings = findings_from_labels(lexmore["labels"])
    assert scoring.gate_reasons(findings, scoring.compute(findings)) == []
