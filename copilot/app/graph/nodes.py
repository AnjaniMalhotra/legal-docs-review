"""Nodes of the policy-check graph: classify -> score -> human_gate -> finalize.

LLM work happens only in classify_all. Everything after it is plain Python.
"""
from typing import TypedDict

from langgraph.types import interrupt

from app.core import doc_store, tracing
from app.core.config import standards
from app.policy import checks, classifier, grounding, report, review, scoring
from app.policy.classifier import ClassificationError


class ReviewState(TypedDict, total=False):
    """State carried through the graph (persisted by the checkpointer)."""
    review_id: str
    doc_id: str
    file_name: str
    reviewer: str
    matter: dict                # intake details: counterparty, agreement type, matter reference
    trace_id: str | None
    findings: list[dict]        # one per standard
    system_result: dict         # score before the human gate
    gate_reasons: list[str]     # why the workflow paused (empty = no gate)
    flagged: list[str]          # rule ids the reviewer must decide on
    audit: list[dict]           # reviewer decisions with name and time
    final_result: dict          # score after the human gate
    report: dict


def _record_guardrails(finding: dict) -> None:
    """Show in Langfuse which Python guardrails changed this finding. Changes no result."""
    rule_id = finding["rule_id"]
    if finding.get("red_flag"):
        tracing.guardrail("red_flag", rule=rule_id, phrase=finding["red_flag"])
    if finding.get("grounded") is False:
        tracing.guardrail("grounding", rule=rule_id)
    if "numeric_value" in finding:
        tracing.guardrail("numeric_check", rule=rule_id, value=finding["numeric_value"])


def _classify_one(doc_id: str, rule: dict, pages: list[str]) -> dict:
    """Judge one standard, then verify its quote and numbers; a failed answer goes to a lawyer."""
    try:
        finding = classifier.classify(doc_id, rule)
    except ClassificationError as exc:  # bad JSON twice: worst case, a human decides
        finding = {"rule_id": rule["id"], "title": rule["title"], "weight": rule["weight"],
                   "llm_status": "Not found", "status": scoring.NEEDS_REVIEW, "evidence_quote": "",
                   "page": None, "clause_ref": "", "grounded": False,
                   "reason": f"The AI could not give a clear answer for this standard, so a lawyer must check it. (Technical detail: {exc})"}
        _record_guardrails(finding)
        return finding
    finding = checks.numbers(grounding.apply_guard(finding, pages), rule)   # numbers only on verified quotes
    _record_guardrails(finding)
    return finding


def classify_all(state: ReviewState) -> dict:
    """Step 1: judge every standard (the only step that calls the model)."""
    doc = doc_store.load_document(state["doc_id"])
    findings = [_classify_one(state["doc_id"], r, doc["pages"]) for r in standards()]
    return {"findings": findings, "file_name": doc["file_name"]}


def score(state: ReviewState) -> dict:
    """Step 2: compute the risk score and decide whether a lawyer must approve."""
    result = scoring.compute(state["findings"])
    reasons = scoring.gate_reasons(state["findings"], result)
    if reasons:
        tracing.guardrail("human_gate", reasons=reasons)
    return {
        "system_result": result,
        "gate_reasons": reasons,
        "flagged": scoring.flagged_rule_ids(state["findings"]),
    }


def human_gate(state: ReviewState) -> dict:
    """Pause (LangGraph interrupt) until the reviewer decides every flagged finding."""
    if not state["gate_reasons"]:
        return {"audit": []}
    decisions = interrupt({"gate_reasons": state["gate_reasons"], "flagged": state["flagged"]})
    findings, audit = review.apply(state["findings"], decisions, state["reviewer"])
    return {"findings": findings, "audit": audit}


def finalize(state: ReviewState) -> dict:
    """Step 4: re-score with the lawyer's decisions and save the report."""
    final = scoring.compute(state["findings"])
    meta = {k: state.get(k) for k in ("review_id", "doc_id", "file_name", "reviewer", "matter", "trace_id")}
    built = report.build(meta, state["findings"], state["system_result"], final, state.get("audit", []))
    doc_store.save_report(state["review_id"], built)
    return {"final_result": final, "report": built}
