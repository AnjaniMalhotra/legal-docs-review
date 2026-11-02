"""Builds the policy-check LangGraph, then starts and resumes reviews. Used by the API and by evals.

The SQLite checkpointer keeps a paused review (human gate) on disk, so the reviewer
can reload the page or come back later and resume the same review.
"""
import sqlite3
from functools import lru_cache

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command

from app.core import doc_store
from app.core.config import data_dir
from app.core.errors import DecisionError, NotFoundError
from app.core.tracing import current_trace_id, flush, tag_trace, traced
from app.graph import nodes
from app.policy import review


@lru_cache
def policy_graph():
    g = StateGraph(nodes.ReviewState)
    g.add_node("classify", nodes.classify_all)
    g.add_node("score", nodes.score)
    g.add_node("human_gate", nodes.human_gate)
    g.add_node("finalize", nodes.finalize)
    g.add_edge(START, "classify")
    g.add_edge("classify", "score")
    g.add_edge("score", "human_gate")
    g.add_edge("human_gate", "finalize")
    g.add_edge("finalize", END)
    conn = sqlite3.connect(str(data_dir("checkpoints") / "reviews.sqlite"), check_same_thread=False)
    return g.compile(checkpointer=SqliteSaver(conn))


def _config(review_id: str) -> dict:
    return {"configurable": {"thread_id": review_id}}


def status(review_id: str) -> dict:
    """Current state of a review: awaiting_review (with findings) or final (with report)."""
    snap = policy_graph().get_state(_config(review_id))
    values = snap.values or {}
    if not values:
        raise NotFoundError(f"Unknown review {review_id}.")
    if snap.next:  # paused at the human gate
        return {
            "review_id": review_id,
            "state": "awaiting_review",
            "findings": values["findings"],
            "system_result": values["system_result"],
            "gate_reasons": values["gate_reasons"],
            "flagged": values["flagged"],
        }
    return {"review_id": review_id, "state": "final", "report": values["report"]}


@traced("policy_check.start")
def start(doc_id: str, reviewer: str, matter: dict | None = None) -> dict:
    """matter: optional intake details (counterparty, agreement type, matter reference)."""
    review_id = doc_store.new_id("rev")
    tag_trace(doc_id=doc_id, reviewer=reviewer, review_id=review_id)
    initial = {"review_id": review_id, "doc_id": doc_id, "reviewer": reviewer,
               "matter": matter or {}, "trace_id": current_trace_id()}
    policy_graph().invoke(initial, _config(review_id))
    flush()
    return status(review_id)


@traced("policy_check.resume")
def resume(review_id: str, decisions: list[dict]) -> dict:
    current = status(review_id)
    if current["state"] != "awaiting_review":
        raise DecisionError("This review is already final.")
    review.validate(decisions, current["flagged"])  # validate before resuming the graph
    tag_trace(review_id=review_id, decisions=decisions)
    policy_graph().invoke(Command(resume=decisions), _config(review_id))
    flush()
    return status(review_id)
