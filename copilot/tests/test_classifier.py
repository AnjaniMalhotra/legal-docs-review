"""The classifier rejects a combined status ("Not found | N/A") and retries, telling the model what was wrong."""
import json

from app.core import gateway
from app.core.config import rule
from app.policy import classifier
from app.rag import retriever

CLAUSE = {"text": "Each Party's aggregate liability shall not exceed the Fees paid in the twelve (12) months.",
          "page": 6, "heading": "15.2 LIMITATION OF LIABILITY"}


def test_invalid_status_is_retried_with_feedback(monkeypatch):
    prompts = []
    replies = iter([
        json.dumps({"status": "Not found | N/A", "evidence_quote": ""}),
        json.dumps({"status": "Compliant", "evidence_quote": CLAUSE["text"], "page": 6,
                    "clause_ref": "15.2", "reason": "Capped at twelve months' Fees."}),
    ])
    monkeypatch.setattr(retriever, "for_rule", lambda doc_id, r: [CLAUSE])
    monkeypatch.setattr(gateway, "chat", lambda role, prompt, json_mode=False: prompts.append(prompt) or next(replies))
    finding = classifier.classify("doc", rule("P1"))
    assert finding["llm_status"] == "Compliant" and len(prompts) == 2
    assert "REJECTED" not in prompts[0] and "invalid status 'Not found | N/A'" in prompts[1]


def _run(monkeypatch, replies: list[dict]) -> tuple[dict, list[str]]:
    prompts, it = [], iter(json.dumps(r) for r in replies)
    monkeypatch.setattr(retriever, "for_rule", lambda doc_id, r: [CLAUSE])
    monkeypatch.setattr(gateway, "chat", lambda role, prompt, json_mode=False: prompts.append(prompt) or next(it))
    return classifier.classify("doc", rule("P5")), prompts


def test_unquoted_na_is_asked_for_its_quote(monkeypatch):
    finding, prompts = _run(monkeypatch, [{"status": "N/A", "evidence_quote": ""},
                                          {"status": "N/A", "evidence_quote": "Synthetic data only.", "page": 2}])
    assert finding["llm_status"] == "N/A" and "N/A needs a verbatim evidence_quote" in prompts[1]


def test_unquoted_na_twice_becomes_not_found(monkeypatch):
    # Lexmore P5: the contract is silent on audit; the model said N/A twice without a quote.
    finding, _ = _run(monkeypatch, [{"status": "N/A", "evidence_quote": ""}] * 2)
    assert finding["llm_status"] == "Not found" and finding["status"] == "Silent (OK)"   # P5 if_silent: ok


def test_hedged_not_found_or_na_twice_becomes_not_found(monkeypatch):
    # Saffron P1/P4 (unseen contract): the model answered "Not found | N/A" twice.
    finding, prompts = _run(monkeypatch, [{"status": "Not found | N/A", "evidence_quote": ""}] * 2)
    assert finding["llm_status"] == "Not found" and finding["status"] == "Silent (OK)"   # P5 if_silent: ok
    assert "if no clause covers the standard" in prompts[1]
