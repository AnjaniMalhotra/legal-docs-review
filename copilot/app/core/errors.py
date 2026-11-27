"""Named errors for the app.

Modules raise these instead of generic exceptions, so a real bug (e.g. a KeyError
in our own code) is never mistaken for a model failure. More errors join in later steps.
"""


class GatewayError(RuntimeError):
    """A model role failed and has no fallback. Never silently downgrade."""
