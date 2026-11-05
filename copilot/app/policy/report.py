"""Builds the final review report: risk rating, findings, Issues List and audit trail.

The Issues List is the negotiation document sent to the counterparty: for each deviation
it sets the client's drafting against PayNest's standard position, with the proposed
amendment and the internal approval authority required to accept the deviation.
"""
from datetime import datetime, timezone

from app.core.config import rule, settings

ACCEPTABLE = ("Compliant", "Silent (OK)", "N/A")
FALLBACK_ONLY = ("Partial",)   # within delegated authority; everything else needs walk-away approval


def _approver(r: dict, status: str) -> str:
    """Who may approve this finding, according to the standard."""
    return r["approval"]["fallback"] if status in FALLBACK_ONLY else r["approval"]["walk_away"]


def issues_list(findings: list[dict]) -> list[dict]:
    """One issue per deviation from the standards, most severe (weight x gap) first."""
    gaps = settings()["scoring"]["gap_factors"]
    issues = []
    for f in findings:
        if f["status"] in ACCEPTABLE:
            continue
        r = rule(f["rule_id"])
        issues.append({
            "rule_id": f["rule_id"],
            "title": r["title"],
            "status": f["status"],
            "clause_ref": f.get("clause_ref", ""),
            "page": f.get("page"),
            "client_drafting": f.get("evidence_quote", ""),
            "paynest_position": r["preferred"],
            "proposed_amendment": r["proposed_amendment"],
            "approval_required": _approver(r, f["status"]),
            "impact": f["weight"] * gaps.get(f["status"], 0),
        })
    return sorted(issues, key=lambda i: (-i["impact"], int(i["rule_id"][1:])))


def headline(result: dict, issues: list[dict]) -> str:
    """One-line summary of the review's main risk."""
    if not issues:
        return f"Risk rating: {result['band']}. The agreement conforms to the Contracting Standards."
    key = "; ".join(i["title"] for i in issues[:3])
    return f"Risk rating: {result['band']}. Key issues to resolve before execution: {key}."


def build(meta: dict, findings: list[dict], system: dict, final: dict, audit: list[dict]) -> dict:
    """Assemble the final report and Issues List."""
    issues = issues_list(findings)
    return {
        "review_id": meta["review_id"],
        "doc_id": meta["doc_id"],
        "file_name": meta["file_name"],
        "reviewer": meta["reviewer"],
        "matter": meta.get("matter") or {},
        "standards_version": settings()["app"]["standards_version"],
        "models": {role: cfg["model"] for role, cfg in settings()["models"].items()},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "system_result": system,
        "final_result": final,
        "headline": headline(final, issues),
        "findings": findings,
        "issues": issues,
        "audit": audit,
        "trace_id": meta.get("trace_id"),
        "disclaimer": "Prepared against PayNest's internal Contracting Standards. Not legal advice.",
    }
