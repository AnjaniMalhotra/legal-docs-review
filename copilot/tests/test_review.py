"""Human-gate decisions: validation rules and the audit trail."""
import pytest

from app.core.errors import DecisionError
from app.policy import review
from app.policy.scoring import NEEDS_REVIEW

FINDINGS = [
    {"rule_id": "P1", "status": "Conflicting", "llm_status": "Conflicting"},
    {"rule_id": "P3", "status": NEEDS_REVIEW, "llm_status": "Partial"},
    {"rule_id": "P8", "status": "Partial", "llm_status": "Partial"},
]


def test_every_flagged_rule_needs_a_decision():
    with pytest.raises(DecisionError, match="P3"):
        review.validate([{"rule_id": "P1", "action": "approve"}], ["P1", "P3"])


def test_override_requires_note_and_valid_status():
    with pytest.raises(DecisionError, match="note"):
        review.validate([{"rule_id": "P1", "action": "override", "new_status": "Partial"}], ["P1"])
    with pytest.raises(DecisionError, match="valid"):
        review.validate([{"rule_id": "P1", "action": "override", "new_status": NEEDS_REVIEW, "note": "x"}], ["P1"])


def test_apply_records_audit_and_changes_status():
    decisions = [
        {"rule_id": "P1", "action": "override", "new_status": "Partial", "note": "Client agreed to 24-month super-cap"},
        {"rule_id": "P3", "action": "approve"},
    ]
    findings, audit = review.apply(FINDINGS, decisions, "Legal Counsel")
    by_id = {f["rule_id"]: f for f in findings}
    assert by_id["P1"]["status"] == "Partial"
    assert by_id["P3"]["status"] == "Partial"       # approving Needs review restores the model's reading
    assert by_id["P8"]["status"] == "Partial"       # untouched
    assert [a["rule_id"] for a in audit] == ["P1", "P3"]
    assert audit[0]["old_status"] == "Conflicting" and audit[0]["reviewer"] == "Legal Counsel"
