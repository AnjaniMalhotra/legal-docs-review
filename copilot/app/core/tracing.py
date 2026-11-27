"""Thin wrapper around self-hosted Langfuse.

If Langfuse keys are not set (e.g. in unit tests), every helper is a no-op,
so the app still runs. Traces never leave the machine: LANGFUSE_HOST must be local.
Tracing must never break the product: every call is wrapped and failures are logged.
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
    """Run a tracing call; a tracing failure must never stop the app."""
    try:
        return fn(*args, **kwargs)
    except Exception as exc:  # never let observability break the app
        log.warning("Langfuse %s failed: %s", action, exc)
        return None


def traced(name: str):
    """Decorator: record the function as a Langfuse span/trace named `name`."""
    if ENABLED:
        return observe(name=name)
    return lambda fn: fn


def flush() -> None:
    """Send any buffered traces to Langfuse now."""
    if ENABLED:
        _safe("flush", lambda: get_client().flush())
