"""Finds the provisions most relevant to a question or a standard.

Both use hybrid retrieval: semantic search returns a wider set of candidates, which are then
re-ranked by how many key terms each provision contains (the standard's `look_for` terms, or
the question's own words). This lifts provisions with the exact drafting ("unlimited",
"invoices") above definitions and boilerplate that are only loosely similar in meaning.
"""
import re

from app.core.config import settings
from app.core.tracing import traced
from app.ingest import vector_store


def _rerank(candidates: list[dict], terms: list[str], keep: int) -> list[dict]:
    """Boost candidates containing the search terms, then keep the best."""
    boost = settings()["retrieval"]["keyword_boost"]

    def score(hit: dict) -> float:
        """Similarity plus a bonus for each term found."""
        text = hit["text"].lower()
        return (1 - hit["distance"]) + boost * sum(term in text for term in terms)

    return sorted(candidates, key=score, reverse=True)[:keep]


@traced("retrieve.question")
def for_question(doc_id: str, question: str) -> list[dict]:
    """Hybrid search on the question, plus the opening (parties and recitals) for general questions."""
    cfg = settings()["retrieval"]
    terms = [w for w in re.findall(r"[a-z0-9]+", question.lower()) if len(w) >= cfg["min_term_length"]]
    hits = _rerank(vector_store.search(doc_id, question, cfg["chat_candidates"]), terms, cfg["top_k_chat"])
    opening = vector_store.opening(doc_id, cfg["chat_opening_chunks"])
    seen = {h["text"] for h in hits}
    return hits + [h for h in opening if h["text"] not in seen]


@traced("retrieve.rule")
def for_rule(doc_id: str, rule: dict) -> list[dict]:
    """The clauses most relevant to one standard: by meaning, then re-ranked by its look_for terms."""
    cfg = settings()["retrieval"]
    query = f"{rule['title']}. {', '.join(rule['look_for'])}. {rule['preferred']}"
    candidates = vector_store.search(doc_id, query, cfg["rule_candidates"])
    return _rerank(candidates, [t.lower() for t in rule["look_for"]], cfg["top_k_rule"])
