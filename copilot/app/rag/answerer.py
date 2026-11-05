"""Answers a reviewer's typed question from the contract, with citations.

Uses the analyst role. Replies "Not found in the document." when no clause answers.
"""
from app.core import doc_store, gateway
from app.core.config import format_clauses, prompt_text, render
from app.core.tracing import current_trace_id, guardrail, tag_trace, traced
from app.rag import output_guard, retriever

NOT_FOUND = "Not found in the document."


@traced("answer")
def answer(doc_id: str, question: str) -> dict:
    """Answer a question from retrieved clauses only, with citations or "Not found"."""
    doc_store.load_document(doc_id)  # raises NotFoundError for an unknown document
    chunks = retriever.for_question(doc_id, question)
    prompt = render("chat_answer", clauses=format_clauses(chunks), question=question)
    text = gateway.chat("analyst", prompt) if chunks else NOT_FOUND
    tag_trace(doc_id=doc_id)
    if output_guard.leaked(text, prompt_text("chat_answer")):
        guardrail("prompt_leak")
        text = output_guard.refusal()
    not_found = text.lower().startswith(NOT_FOUND.lower().rstrip("."))
    if not_found:
        guardrail("not_found")
    return {
        "answer": text,
        "found": not not_found and text != output_guard.refusal(),
        "contexts": [c["text"] for c in chunks],   # used by evals (Ragas)
        "trace_id": current_trace_id(),
    }
