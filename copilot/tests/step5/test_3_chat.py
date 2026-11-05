"""Chat must be honest when the contract has no answer."""
from app.core import doc_store, gateway
from app.rag import answerer, retriever

CLAUSE = {"text": "Invoices are payable within 45 days.", "page": 5, "heading": "7.3 FEES", "distance": 0.2}


def test_no_clauses_means_no_model_call(monkeypatch):
    calls = []
    doc_id = doc_store.save_document("contract.pdf", ["page one"])
    monkeypatch.setattr(retriever, "for_question", lambda d, q: [])
    monkeypatch.setattr(gateway, "chat", lambda *args, **kwargs: calls.append(1))

    result = answerer.answer(doc_id, "What uptime do we promise?")

    assert calls == []
    assert result["found"] is False


def test_not_found_is_reported_as_not_found(monkeypatch):
    doc_id = doc_store.save_document("contract.pdf", ["page one"])
    monkeypatch.setattr(retriever, "for_question", lambda d, q: [CLAUSE])
    monkeypatch.setattr(gateway, "chat", lambda *args, **kwargs: "Not found in the document.")

    assert answerer.answer(doc_id, "What uptime do we promise?")["found"] is False


def test_a_real_answer_is_reported_as_found(monkeypatch):
    doc_id = doc_store.save_document("contract.pdf", ["page one"])
    monkeypatch.setattr(retriever, "for_question", lambda d, q: [CLAUSE])
    monkeypatch.setattr(gateway, "chat", lambda *args, **kwargs: "Within 45 days [p.5, 7.3 FEES].")

    assert answerer.answer(doc_id, "When do they pay?")["found"] is True
