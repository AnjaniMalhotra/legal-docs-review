"""Thin wrapper around self-hosted Langfuse.

If Langfuse keys are not set (e.g. in unit tests), every helper is a no-op,
so the app still runs. Traces never leave the machine: LANGFUSE_HOST must be local.
Tracing must never break the product: every call is wrapped and failures are logged.
Works with Langfuse SDK v3 (update_current_trace) and v4/v5 (update_current_span).
"""
import logging
import os

log = logging.getLogger(__name__)

try:
    from langfuse import get_client, observe

    ENABLED = bool(os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_HOST"))
except ImportError:  # langfuse not installed
    ENABLED = False


def _safe(action: str, fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception as exc:  # never let observability fail a review
        log.warning("Langfuse %s failed: %s", action, exc)
        return None


def traced(name: str):
    """Decorator: record the function as a Langfuse span/trace named `name`."""
    if ENABLED:
        return observe(name=name)
    return lambda fn: fn


def current_trace_id() -> str | None:
    if not ENABLED:
        return None
    return _safe("get trace id", lambda: get_client().get_current_trace_id())


def tag_trace(**metadata) -> None:
    """Attach metadata (doc id, reviewer, review id, decisions) to the current span/trace."""
    if not ENABLED:
        return
    client = get_client()
    update = getattr(client, "update_current_trace", None) or getattr(client, "update_current_span", None)
    if update:
        _safe("tag", update, metadata=metadata)


def score(trace_id: str | None, name: str, value: float, comment: str = "") -> None:
    """Write a quality score (e.g. Ragas faithfulness) onto a trace."""
    if ENABLED and trace_id:
        _safe("score", lambda: get_client().create_score(trace_id=trace_id, name=name, value=value, comment=comment))


def flush() -> None:
    if ENABLED:
        _safe("flush", lambda: get_client().flush())
