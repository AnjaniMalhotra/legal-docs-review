"""Plain-English summary of an agreement's key terms, separate from the standards review.

For each section in settings.summary, the most relevant provisions are retrieved and the
analyst model writes all section summaries in ONE call. The sources (clause and page) are
attached by Python from the retrieval, never by the model. The result is cached per document.
"""
import json
import re

from app.core import doc_store, gateway
from app.core.config import render, settings
from app.core.errors import GatewayError
from app.core.tracing import traced
from app.ingest import vector_store

NOT_STATED = "Not stated in the agreement."


def _gather(doc_id: str, pages: list[str], cfg: dict) -> list[dict]:
    """Retrieve provisions per section; sections with `opening_pages` read the agreement's first pages."""
    sections = []
    for s in cfg["sections"]:
        if "opening_pages" in s:
            hits = [{"heading": "Cover page and recitals", "page": n + 1, "text": pages[n]}
                    for n in range(min(s["opening_pages"], len(pages)))]
        else:
            hits = vector_store.search(doc_id, s["query"], cfg["top_k_per_section"])
        sections.append({"name": s["name"], "hits": hits})
    return sections


def _evidence(sections: list[dict], max_chars: int) -> str:
    blocks = []
    for s in sections:
        clauses = "\n".join(f"[{h['heading'] or 'untitled'}, p.{h['page']}] {h['text'][:max_chars]}" for h in s["hits"])
        blocks.append(f"## {s['name']}\n{clauses or '(no provision found)'}")
    return "\n\n".join(blocks)


def _parse(raw: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.S)
    try:
        data = json.loads(match.group(0)) if match else {}
    except json.JSONDecodeError:
        data = {}
    if not str(data.get("overview", "")).strip():
        raise GatewayError("The summary could not be generated. Please try again.")
    return data


@traced("summary")
def summarise(doc_id: str) -> dict:
    cached = doc_store.load_summary(doc_id)
    if cached:
        return cached
    doc = doc_store.load_document(doc_id)  # NotFoundError for an unknown document
    cfg = settings()["summary"]
    sections = _gather(doc_id, doc["pages"], cfg)
    prompt = render("summarise_agreement", sections=_evidence(sections, cfg["max_chars_per_clause"]),
                    names=", ".join(s["name"] for s in sections))
    data = _parse(gateway.chat("analyst", prompt, json_mode=True))
    written = data.get("sections") or {}
    result = {
        "doc_id": doc_id,
        "file_name": doc["file_name"],
        "overview": str(data["overview"]).strip(),
        "sections": [{"name": s["name"],
                      "summary": str(written.get(s["name"]) or NOT_STATED).strip(),
                      "sources": [{"clause": h["heading"], "page": h["page"]} for h in s["hits"]]}
                     for s in sections],
    }
    doc_store.save_summary(doc_id, result)
    return result
