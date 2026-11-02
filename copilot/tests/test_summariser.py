"""Agreement summary: sources come from retrieval (not the model), results are cached, bad output fails loudly."""
import json

import pytest

from app.core import doc_store, gateway
from app.core.errors import GatewayError
from app.ingest import vector_store
from app.rag import summariser

HIT = {"text": "Invoices are payable within forty-five (45) days of receipt.", "page": 5,
       "heading": "7.3 FEES, INVOICING AND PAYMENT", "distance": 0.2}


@pytest.fixture
def doc_id(monkeypatch):
    monkeypatch.setattr(vector_store, "search", lambda doc_id, query, k: [HIT])
    return doc_store.save_document("carewell.pdf", ["page one"])


def test_summary_attaches_sources_and_is_cached(doc_id, monkeypatch):
    calls = []

    def fake_chat(role, prompt, json_mode=False):
        calls.append(prompt)
        return json.dumps({"overview": "A three-year payroll services agreement.",
                           "sections": {"Fees and payment": "Invoices are payable within 45 days."}})

    monkeypatch.setattr(gateway, "chat", fake_chat)
    result = summariser.summarise(doc_id)
    fees = next(s for s in result["sections"] if s["name"] == "Fees and payment")
    assert fees["summary"] == "Invoices are payable within 45 days."
    assert fees["sources"] == [{"clause": "7.3 FEES, INVOICING AND PAYMENT", "page": 5}]
    parties = next(s for s in result["sections"] if s["name"] == "Parties and purpose")
    assert parties["summary"] == summariser.NOT_STATED          # model left it out
    summariser.summarise(doc_id)
    assert len(calls) == 1                                       # second call served from cache


def test_unusable_model_output_fails_loudly(doc_id, monkeypatch):
    monkeypatch.setattr(gateway, "chat", lambda *a, **k: "Sorry, I cannot help with that.")
    with pytest.raises(GatewayError):
        summariser.summarise(doc_id)
