"""The Issues List: only real problems, worst first, with the right person to approve."""
from app.core.config import rule
from app.policy.report import issues_list


def finding(rule_id, status):
    return {"rule_id": rule_id, "status": status, "weight": rule(rule_id)["weight"], "evidence_quote": "client wording"}


def test_ok_findings_are_left_out():
    assert issues_list([finding("P1", "Compliant"), finding("P5", "N/A")]) == []


def test_worst_issue_comes_first():
    issues = issues_list([finding("P8", "Conflicting"), finding("P1", "Conflicting")])
    assert issues[0]["rule_id"] == "P1"     # P1 has weight 5, P8 has weight 2


def test_acceptable_needs_the_junior_approver():
    issue = issues_list([finding("P1", "Partial")])[0]
    assert issue["approval_required"] == rule("P1")["approval"]["fallback"]


def test_not_acceptable_needs_the_senior_approver():
    issue = issues_list([finding("P1", "Conflicting")])[0]
    assert issue["approval_required"] == rule("P1")["approval"]["walk_away"]
