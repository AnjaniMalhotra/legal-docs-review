"""Deterministic risk scoring. No LLM involved.

Weights and if_silent come from the standards; gap factors, bands, floor and
gate conditions come from settings.yaml. Same findings -> same score, always.
"""
import math

from app.core.config import standards, settings

# Data contract (fixed by design, not tunables): what the LLM may return.
LLM_STATUSES = ("Compliant", "Partial", "Conflicting", "Not found", "N/A")
NEEDS_REVIEW = "Needs review"
ALL_STATUSES = ("Compliant", "Partial", "Conflicting", "Missing", "Silent (OK)", "N/A", NEEDS_REVIEW)


def resolve_status(llm_status: str, rule: dict) -> str:
    """Map the LLM's 'Not found' to Missing or Silent (OK) using the rule's if_silent."""
    if llm_status != "Not found":
        return llm_status
    return "Missing" if rule["if_silent"] == "risk" else "Silent (OK)"


def _band_for(score: int) -> str:
    """The band a score falls in."""
    for step in settings()["scoring"]["bands"]:
        if score <= step["max"]:
            return step["band"]
    return settings()["scoring"]["bands"][-1]["band"]


def _band_rank(band: str) -> int:
    """A band's position, so bands can be compared."""
    return [b["band"] for b in settings()["scoring"]["bands"]].index(band)


def _weighted_table(findings: list[dict], cfg: dict) -> tuple[list[dict], float, int]:
    """The w*g row for each finding, plus the totals (excluded statuses are left out)."""
    weights = {r["id"]: r["weight"] for r in standards()}
    table, total_wg, total_w = [], 0.0, 0
    for f in findings:
        if f["status"] in cfg["excluded_statuses"]:
            continue
        w, g = weights[f["rule_id"]], cfg["gap_factors"][f["status"]]
        table.append({"rule_id": f["rule_id"], "weight": w, "status": f["status"], "gap": g, "wg": w * g})
        total_wg += w * g
        total_w += w
    return table, total_wg, total_w


def compute(findings: list[dict]) -> dict:
    """findings: [{rule_id, status}] -> score, band, floor info and the w*g table."""
    cfg = settings()["scoring"]
    critical = {r["id"] for r in standards() if r["critical"]}
    table, total_wg, total_w = _weighted_table(findings, cfg)
    score = math.floor(100 * total_wg / total_w + 0.5) if total_w else 0
    raw_band = band = _band_for(score)
    floor_rules = [f["rule_id"] for f in findings
                   if f["rule_id"] in critical and f["status"] in cfg["floor"]["statuses"]]
    if floor_rules and _band_rank(band) < _band_rank(cfg["floor"]["min_band"]):
        band = cfg["floor"]["min_band"]
    return {
        "score": score,
        "raw_band": raw_band,
        "band": band,
        "floor_rules": floor_rules,
        "floor_applied": band != raw_band,
        "sum_wg": total_wg,
        "sum_w": total_w,
        "table": table,
    }


def gate_reasons(findings: list[dict], result: dict) -> list[str]:
    """Why the workflow must pause for a human. Empty list = no gate."""
    cfg = settings()["gate"]
    reasons = []
    if result["band"] in cfg["bands"]:
        reasons.append(f"Band is {result['band']}")
    for f in findings:
        if f["status"] in cfg["statuses"]:
            reasons.append(f"{f['rule_id']} is {f['status']}")
    return reasons


def flagged_rule_ids(findings: list[dict]) -> list[str]:
    """Findings the reviewer must decide on: gate statuses plus critical risks."""
    cfg = settings()["gate"]
    critical = {r["id"] for r in standards() if r["critical"]}
    floor_statuses = settings()["scoring"]["floor"]["statuses"]
    return [f["rule_id"] for f in findings
            if f["status"] in cfg["statuses"]
            or (f["rule_id"] in critical and f["status"] in floor_statuses)]
