"""A review pauses for a lawyer, survives a restart, then finishes. The model is fake: it returns CareWell's answer key."""
import json
import re

from app.core import doc_store, gateway
from app.graph import policy_service
from app.rag import retriever


def start_carewell_review(golden, monkeypatch):
    labels = golden["contracts"][0]["labels"]     # CareWell
    doc_id = doc_store.save_document("carewell.pdf", ["Quote for this rule."])

    def fake_model(role, prompt, json_mode=False):
        rule_id = re.search(r"STANDARD (P\d+) ", prompt).group(1)
        return json.dumps({"status": labels[rule_id], "evidence_quote": "Quote for this rule.", "page": 1, "reason": "test"})

    monkeypatch.setattr(gateway, "chat", fake_model)
    monkeypatch.setattr(retriever, "for_rule", lambda d, r: [])
    policy_service.policy_graph.cache_clear()     # use this test's own checkpoint file
    return policy_service.start(doc_id, "Legal Counsel")


def approve_all(review):
    return [{"rule_id": rule_id, "action": "approve"} for rule_id in review["flagged"]]


def test_a_risky_contract_waits_for_a_lawyer(golden, monkeypatch):
    review = start_carewell_review(golden, monkeypatch)
    assert review["state"] == "awaiting_review"
    assert review["flagged"] == ["P1", "P3"]


def test_a_paused_review_survives_a_restart(golden, monkeypatch):
    review = start_carewell_review(golden, monkeypatch)
    policy_service.policy_graph.cache_clear()     # same as restarting the app
    final = policy_service.resume(review["review_id"], approve_all(review))
    assert final["state"] == "final"


def test_the_lawyers_change_updates_the_score(golden, monkeypatch):
    review = start_carewell_review(golden, monkeypatch)
    decisions = [{"rule_id": "P1", "action": "approve"},
                 {"rule_id": "P3", "action": "override", "new_status": "Partial", "note": "Client agreed 24 hours"}]
    report = policy_service.resume(review["review_id"], decisions)["report"]
    assert report["system_result"]["score"] == 49
    assert report["final_result"]["score"] == 41
    assert len(report["audit"]) == 2
