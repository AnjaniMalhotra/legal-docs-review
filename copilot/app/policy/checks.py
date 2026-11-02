"""Deterministic checks under the model. Both can only make a finding STRICTER, never milder.

red_flag(): each standard lists `red_flags`, phrases that only appear in walk-away drafting
("unlimited", "immediately"). If one appears in a retrieved clause but the model did NOT say
Conflicting, the finding becomes "Needs review" so counsel decides. An optional
`red_flag_context` limits a phrase to sentences on the rule's subject, so "notify immediately
of any invoice discrepancy" does not trip the breach-notice rule.

numbers(): a 7B model misreads periods and percentages (45 vs 60 days, 99.9% uptime). A
standard's `numeric_check` gives a regex for the number and bands mapping it to a status.
It runs only on verified (grounded) quotes: a number proves a clause is worse than the model
said, but not that every other condition of "Compliant" is met.
"""
import re

from app.policy.scoring import NEEDS_REVIEW

PLAIN = {"Compliant": "OK", "Partial": "acceptable", "Conflicting": "not acceptable",
         "Not found": "not mentioned", "N/A": "not applicable"}
SEVERITY = {"Compliant": 0, "Partial": 1, "Conflicting": 2}


# --- Red-flag tripwire ------------------------------------------------------------------

def _hit(text: str, rule: dict) -> tuple[str, str] | None:
    """(phrase, sentence) for the first red-flag phrase in a sentence that is on the rule's subject."""
    context = [c.lower() for c in rule.get("red_flag_context", [])]
    for sentence in re.split(r"(?<=[.;])\s+", text):
        low = sentence.lower()
        phrase = next((p for p in rule["red_flags"] if p.lower() in low), None)
        if phrase and (not context or any(c in low for c in context)):
            return phrase, sentence.strip()
    return None


def red_flag(finding: dict, rule: dict, chunks: list[dict]) -> dict:
    """Escalate to Needs review if a walk-away phrase sits in any clause retrieved for the rule."""
    if finding["status"] == "Conflicting" or not rule.get("red_flags"):
        return finding
    for chunk in chunks:
        found = _hit(chunk["text"], rule)
        if found:
            phrase, sentence = found
            said = PLAIN.get(finding["llm_status"], finding["llm_status"])
            return {**finding, "status": NEEDS_REVIEW, "evidence_quote": sentence, "page": chunk["page"],
                    "clause_ref": chunk["heading"], "red_flag": phrase,
                    "reason": f"The clause contains \"{phrase}\" ({chunk['heading']}), a phrase PayNest must "
                              f"never accept, but the AI marked it as {said}. A lawyer must check it."}
    return finding


# --- Numeric check ----------------------------------------------------------------------

def read_value(quote: str, check: dict) -> float | None:
    """The number the standard cares about, e.g. 45 from "forty-five (45) days"."""
    values = [float(v) for v in re.findall(check["pattern"], quote, re.I)]
    if not values:
        return None
    return max(values) if check.get("pick") == "max" else min(values)


def band_for(value: float, bands: list[dict]) -> str:
    """First band whose `max` covers the value; the last band has no max."""
    return next(b["status"] for b in bands if "max" not in b or value <= b["max"])


def numbers(finding: dict, rule: dict) -> dict:
    """Make the finding stricter if the number in its verified quote falls in a worse band."""
    check = rule.get("numeric_check")
    if not check or not finding.get("grounded") or finding["status"] not in ("Compliant", "Partial"):
        return finding
    value = read_value(finding["evidence_quote"], check)
    if value is None:
        return finding
    status = band_for(value, check["bands"])
    if SEVERITY[status] <= SEVERITY[finding["status"]]:
        return finding
    return {**finding, "status": status, "numeric_value": value,
            "reason": f"{finding['reason']} Numeric check: the quoted clause says {value:g} {check['unit']}, "
                      f"which PayNest's standard treats as {PLAIN[status]} (the AI said {PLAIN[finding['status']]})."}
