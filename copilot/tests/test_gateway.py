"""The gateway asks for a role, sends the model named in settings, and fails loudly (no fallback)."""
import pytest

from app.core import gateway
from app.core.config import settings
from app.core.errors import GatewayError


class _Fake:
    """Stands in for the OpenAI client: records the request, returns a canned reply or raises."""
    def __init__(self, fail: bool = False):
        self.sent, self.fail = {}, fail
        self.chat = self.completions = self

    def create(self, **kwargs):
        if self.fail:
            raise ConnectionError("model server down")
        self.sent = kwargs
        message = type("M", (), {"content": "  PayNest copilot online.  "})
        return type("R", (), {"choices": [type("C", (), {"message": message})]})


def test_role_is_mapped_to_the_model_in_settings(monkeypatch):
    fake = _Fake()
    monkeypatch.setattr(gateway, "_client", lambda base_url: fake)
    assert gateway.chat("analyst", "hello") == "PayNest copilot online."
    assert fake.sent["model"] == settings()["models"]["analyst"]["model"]
    assert fake.sent["temperature"] == settings()["models"]["analyst"]["temperature"]


def test_json_mode_asks_for_a_json_object(monkeypatch):
    fake = _Fake()
    monkeypatch.setattr(gateway, "_client", lambda base_url: fake)
    gateway.chat("analyst", "hello", json_mode=True)
    assert fake.sent["response_format"] == {"type": "json_object"}


def test_a_failure_raises_gateway_error_instead_of_falling_back(monkeypatch):
    monkeypatch.setattr(gateway, "_client", lambda base_url: _Fake(fail=True))
    with pytest.raises(GatewayError, match="analyst"):
        gateway.chat("analyst", "hello")
