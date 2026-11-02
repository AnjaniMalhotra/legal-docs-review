"""End-to-end policy check through the real LangGraph + API, with a fake model.

The fake analyst returns the CareWell golden labels, so the graph must pause at the
human gate with score 49 / High, then finalise with the reviewer's decisions.
"""
import json
import re
import sys
import types

import pytest

pytest.importorskip("langgraph")
pytest.importorskip("fastapi")
if "chromadb" not in sys.modules:  # vector store is mocked below; stub the import only
    stub = types.ModuleType("chromadb")
    stub.ClientAPI, stub.PersistentClient = object, None
    stub.config = types.SimpleNamespace(Settings=dict)
    sys.modules.update({"chromadb": stub, "chromadb.config": stub.config})

from fastapi.testclient import TestClient  # noqa: E402

from app.core import doc_store, gateway  # noqa: E402
from app.core.config import data_dir  # noqa: E402
from app.rag import retriever  # noqa: E402

TO_LLM = {"Missing": "Not found", "Silent (OK)": "Not found"}


@pytest.fixture
def carewell(golden, monkeypatch):
    labels = next(c for c in golden["contracts"] if c["id"] == "carewell")["labels"]
    pages = [" ".join(f"Clause text for {r} on this page." for r in labels)]
    doc_id = doc_store.save_document("carewell.pdf", pages)

    def fake_chat(role, prompt, json_mode=False):
        rule_id = re.search(r"STANDARD (P\d+) ", prompt).group(1)
        status = TO_LLM.get(labels[rule_id], labels[rule_id])
        quote = "" if status == "Not found" else f"Clause text for {rule_id} on this page."
        return json.dumps({"rule_id": rule_id, "status": status, "evidence_quote": quote,
                           "page": 1 if quote else None, "clause_ref": "", "reason": "test"})

    monkeypatch.setattr(gateway, "chat", fake_chat)
    monkeypatch.setattr(retriever, "for_rule", lambda doc_id, rule: [])
    return doc_id


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


def test_review_pauses_then_finalises(client, carewell):
    res = client.post("/api/policy/reviews", json={"doc_id": carewell, "reviewer": "Legal Counsel"})
    assert res.status_code == 200, res.text
    review = res.json()
    assert review["state"] == "awaiting_review"
    assert review["system_result"]["score"] == 49 and review["system_result"]["band"] == "High"
    assert set(review["flagged"]) == {"P1", "P3"}

    bad = client.post(f"/api/policy/reviews/{review['review_id']}/decisions", json={"decisions": []})
    assert bad.status_code == 422  # every flagged rule needs a decision

    decisions = [{"rule_id": "P1", "action": "approve"},
                 {"rule_id": "P3", "action": "override", "new_status": "Partial", "note": "Client agreed 24h"}]
    final = client.post(f"/api/policy/reviews/{review['review_id']}/decisions", json={"decisions": decisions})
    assert final.status_code == 200, final.text
    report = final.json()["report"]
    assert report["system_result"]["score"] == 49
    assert report["final_result"]["score"] == 41          # P3 Conflicting -> Partial: 17 - 2.5 = 14.5 / 35
    assert report["final_result"]["band"] == "High"       # P1 still Conflicting: floor holds
    assert report["issues"][0]["rule_id"] == "P1"
    assert report["issues"][0]["approval_required"] == "General Counsel and Chief Financial Officer"
    assert [a["rule_id"] for a in report["audit"]] == ["P1", "P3"]
    saved = json.loads((data_dir("reports") / f"{review['review_id']}.json").read_text())
    assert saved["headline"].startswith("Risk rating: High")  # audit record written to disk


def test_unknown_ids_are_404(client):
    res = client.post("/api/policy/reviews", json={"doc_id": "doc-missing", "reviewer": "Legal Counsel"})
    assert res.status_code == 404 and "Unknown document" in res.json()["detail"]
    assert client.get("/api/policy/reviews/rev-missing").status_code == 404
    assert client.get("/api/documents/doc-missing").status_code == 404


def test_model_outage_is_503(client, carewell, monkeypatch):
    from app.core.errors import GatewayError

    def down(*args, **kwargs):
        raise GatewayError("Model role 'analyst' failed: connection refused")

    monkeypatch.setattr(gateway, "chat", down)
    res = client.post("/api/policy/reviews", json={"doc_id": carewell, "reviewer": "Legal Counsel"})
    assert res.status_code == 503 and "analyst" in res.json()["detail"]


def test_health_and_ui_are_served(client):
    assert client.get("/api/health").json()["status"] == "ok"
    page = client.get("/")
    assert page.status_code == 200 and "PayNest" in page.text
