"""Domain errors, mapped to HTTP status codes in one place (app/main.py).

Modules raise these instead of generic exceptions, so a real bug (e.g. a KeyError
in our own code) is never mistaken for "document not found".
"""


class NotFoundError(LookupError):
    """An unknown document or review id."""


class GatewayError(RuntimeError):
    """A model role failed and has no fallback. Never silently downgrade."""


class UnreadablePdfError(ValueError):
    """The PDF has no extractable text (likely scanned)."""


class DecisionError(ValueError):
    """Reviewer decisions at the human gate are incomplete or invalid."""


# error class -> HTTP status code, used by the handler in app/main.py
HTTP_STATUS = {
    NotFoundError: 404,
    UnreadablePdfError: 422,
    DecisionError: 422,
    GatewayError: 503,
}
