"""Classifies one standard against the contract with the analyst model.

The model returns strict JSON with one of the LLM statuses. Python then maps
"Not found" via the rule's if_silent setting. Invalid JSON is retried once.
An N/A must quote the clause that makes the standard inapplicable: a 7B model often says N/A
when the contract is merely silent, or hedges with "Not found | N/A". Asked again and still
unquoted or hedged, the answer is treated as Not found (then if_silent decides).
"""
import json
import re

from app.core import gateway
from app.core.config import format_clauses, render, settings
from app.core.tracing import traced
from app.policy import checks
from app.policy.scoring import LLM_STATUSES, resolve_status
from app.rag import retriever


class ClassificationError(RuntimeError):
    pass


class NotFoundFallback(ValueError):
    """An unquoted N/A or a "Not found | N/A" hedge: retried once, then read as Not found."""
    def __init__(self, message: str, data: dict):
        super().__init__(message)
        self.data = data


def _hedged(status: str) -> bool:
    """True for a double answer such as "Not found | N/A"."""
    parts = {p.strip() for p in status.split("|")}
    return len(parts) > 1 and "Not found" in parts and parts <= {"Not found", "N/A"}


def _parse(raw: str, rule_id: str) -> dict:
    """Read and validate the model's JSON reply; raises if it must be retried."""
    match = re.search(r"\{.*\}", raw, re.S)
    if not match:
        raise ValueError("no JSON object in response")
    data = json.loads(match.group(0))
    status = str(data.get("status", "")).strip()
    if _hedged(status):
        raise NotFoundFallback(f"invalid status {status!r}: choose one; if no clause covers the "
                               "standard, the status is Not found", data)
    if status not in LLM_STATUSES:
        raise ValueError(f"invalid status {status!r}")
    if status == "N/A" and not str(data.get("evidence_quote") or "").strip():
        raise NotFoundFallback("N/A needs a verbatim evidence_quote of the clause that makes the standard "
                               "not apply; if no clause says so, the status is Not found", data)
    page = data.get("page")
    return {
        "rule_id": rule_id,
        "llm_status": status,
        "evidence_quote": str(data.get("evidence_quote") or "").strip(),
        "page": int(page) if str(page).isdigit() else None,
        "clause_ref": str(data.get("clause_ref") or "").strip(),
        "reason": str(data.get("reason") or "").strip(),
    }


def _ask_model(prompt: str, rule: dict) -> dict:
    """Call the analyst, retrying with the reason if the reply is rejected."""
    cfg = settings()["classifier"]
    last_error, attempt = None, prompt
    for _ in range(cfg["max_retries"] + 1):
        raw = gateway.chat("analyst", attempt, json_mode=cfg["json_mode"])
        try:
            finding = _parse(raw, rule["id"])
            break
        except (ValueError, json.JSONDecodeError) as exc:
            last_error = exc   # retry, telling the model what was wrong with its reply
            attempt = f"{prompt}\n\n{render('classify_retry', error=str(exc))}"
    else:
        if not isinstance(last_error, NotFoundFallback):
            raise ClassificationError(f"{rule['id']}: {last_error}")
        finding = _parse(json.dumps({**last_error.data, "status": "Not found"}), rule["id"])
    return finding


@traced("classify.rule")
def classify(doc_id: str, rule: dict) -> dict:
    """Judge one standard: find its clauses, ask the model, apply if_silent and the red-flag check."""
    chunks = retriever.for_rule(doc_id, rule)
    prompt = render(
        "classify_rule",
        rule_id=rule["id"], title=rule["title"], preferred=rule["preferred"],
        fallback=rule["fallback"], walk_away=rule["walk_away"], na_when=rule["na_when"],
        clauses=format_clauses(chunks),
    )
    finding = _ask_model(prompt, rule)
    finding["status"] = resolve_status(finding["llm_status"], rule)
    finding["title"] = rule["title"]
    finding["weight"] = rule["weight"]
    return checks.red_flag(finding, rule, chunks)   # deterministic safety net under the model
