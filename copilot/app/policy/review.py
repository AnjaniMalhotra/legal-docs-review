"""Applies the reviewer's decisions at the human gate and records the audit trail.

Decision: {rule_id, action: approve|override|note, new_status?, note?}
Override must name a valid status and include a note.
"""
from datetime import datetime, timezone

from app.core.config import rule
from app.core.errors import DecisionError
from app.policy.scoring import ALL_STATUSES, NEEDS_REVIEW, resolve_status

ACTIONS = ("approve", "override", "note")


def validate(decisions: list[dict], flagged: list[str]) -> None:
    """Reject missing or incomplete decisions before the graph resumes."""
    seen = {d.get("rule_id") for d in decisions}
    missing = [r for r in flagged if r not in seen]
    if missing:
        raise DecisionError(f"decisions missing for: {', '.join(missing)}")
    for d in decisions:
        if d.get("action") not in ACTIONS:
            raise DecisionError(f"{d.get('rule_id')}: unknown action {d.get('action')!r}")
        if d["action"] == "override":
            if d.get("new_status") not in ALL_STATUSES or d["new_status"] == NEEDS_REVIEW:
                raise DecisionError(f"{d['rule_id']}: override needs a valid new status")
            if not (d.get("note") or "").strip():
                raise DecisionError(f"{d['rule_id']}: override needs a note")


def apply(findings: list[dict], decisions: list[dict], reviewer: str) -> tuple[list[dict], list[dict]]:
    """Return (updated findings, audit entries)."""
    by_rule = {d["rule_id"]: d for d in decisions}
    now = datetime.now(timezone.utc).isoformat()
    updated, audit = [], []
    for f in findings:
        f = dict(f)
        d = by_rule.get(f["rule_id"])
        if d:
            old = f["status"]
            if d["action"] == "override":
                f["status"] = d["new_status"]
            elif d["action"] == "approve" and old == NEEDS_REVIEW:
                # reviewer confirmed the model's reading by hand
                f["status"] = resolve_status(f.get("llm_status", "Not found"), rule(f["rule_id"]))
            f["reviewer_decision"] = d["action"]
            f["reviewer_note"] = (d.get("note") or "").strip()
            audit.append({"rule_id": f["rule_id"], "action": d["action"], "old_status": old,
                          "new_status": f["status"], "note": f["reviewer_note"],
                          "reviewer": reviewer, "at": now})
        updated.append(f)
    return updated, audit
