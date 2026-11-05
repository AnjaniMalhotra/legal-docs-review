"""Thin wrapper around self-hosted Langfuse.

If Langfuse keys are not set (e.g. in unit tests), every helper is a no-op,
so the app still runs. Traces never leave the machine: LANGFUSE_HOST must be local.
Tracing must never break the product: every call is wrapped and failures are logged.
Prompts are the exception: with no prompt there is no safe answer, so that failure is raised.
"""
import logging
import os
from contextvars import ContextVar

from app.core.errors import GatewayError

log = logging.getLogger(__name__)
_prompt_tag: ContextVar[str] = ContextVar("prompt_tag", default="")

try:
    from langfuse import get_client, observe, propagate_attributes

    ENABLED = bool(os.getenv("LANGFUSE_PUBLIC_KEY") and os.getenv("LANGFUSE_HOST"))
except ImportError:  # langfuse not installed
    ENABLED = False


def _safe(action: str, fn, *args, **kwargs):
    """Run a tracing call; a tracing failure must never stop a review."""
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
    """The active Langfuse trace id, or None when tracing is off."""
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


def fetch_prompt(name: str, label: str, cache_ttl_s: int) -> str:
    """The labelled version of a prompt from Langfuse. No fallback: a missing prompt fails loudly."""
    try:
        prompt = get_client().get_prompt(name, label=label, type="text", cache_ttl_seconds=cache_ttl_s)
    except Exception as exc:
        raise GatewayError(f"Prompt '{name}' could not be loaded from Langfuse: {exc}") from exc
    _prompt_tag.set(f"{name}@v{prompt.version}")
    tag_trace(prompt=_prompt_tag.get())
    return prompt.prompt


def prompt_tag() -> str:
    """Which prompt version is in use, e.g. chat_answer@v2. The gateway logs it with each call."""
    return _prompt_tag.get()


def guardrail(name: str, **details) -> None:
    """Mark the trace when a guardrail fires, so Langfuse can filter on guardrail:<name>."""
    if not ENABLED:
        return

    def record():
        with propagate_attributes(tags=["guardrail", f"guardrail:{name}"]):
            get_client().create_event(name=f"guardrail.{name}", metadata=details, level="WARNING")

    _safe("guardrail", record)


def score(trace_id: str | None, name: str, value: float, comment: str = "") -> None:
    """Write a quality score (e.g. Ragas faithfulness) onto a trace."""
    if ENABLED and trace_id:
        _safe("score", lambda: get_client().create_score(trace_id=trace_id, name=name, value=value, comment=comment))


def flush() -> None:
    """Send any buffered traces to Langfuse now."""
    if ENABLED:
        _safe("flush", lambda: get_client().flush())
