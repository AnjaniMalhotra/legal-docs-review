"""Chat retrieval also searches the contract's wording, so "breach" finds a "Security Incident" clause."""
from app.ingest import vector_store
from app.rag import retriever

NOTICE = {"text": "The Service Provider shall notify the Client immediately of any Security Incident.",
          "page": 5, "heading": "9.3 SECURITY INCIDENTS", "distance": 0.40}
OTHER = {"text": "Either Party may terminate this Agreement on written notice.",   # closer in meaning, wrong clause
         "page": 7, "heading": "17.1 TERMINATION", "distance": 0.35}


def _search(monkeypatch) -> list[str]:
    queries = []
    monkeypatch.setattr(vector_store, "search", lambda doc_id, query, k: queries.append(query) or [OTHER, NOTICE])
    monkeypatch.setattr(vector_store, "opening", lambda doc_id, n: [])
    return queries


def test_breach_also_searches_for_security_incident(monkeypatch):
    queries = _search(monkeypatch)
    hits = retriever.for_question("doc", "How fast must we tell them about a breach?")
    assert "security incident" in queries[0]
    assert hits[0]["heading"] == NOTICE["heading"]     # the contract's own wording now ranks first


def test_question_without_a_synonym_is_searched_as_written(monkeypatch):
    queries = _search(monkeypatch)
    retriever.for_question("doc", "Which court handles disputes?")
    assert queries == ["Which court handles disputes?"]


def test_synonyms_match_whole_words_only(monkeypatch):
    queries = _search(monkeypatch)
    retriever.for_question("doc", "What does repayment mean?")     # contains "pay", but is not the word "pay"
    assert queries == ["What does repayment mean?"]
