"""With Langfuse on, prompts come from Langfuse only. If it cannot give one, the app fails loudly."""
import pytest

from app.core import gateway, tracing
from app.core.config import render, settings
from app.core.errors import GatewayError


class FakeLangfuse:
    """Stands in for the Langfuse client: returns version 7 of a prompt, or fails."""
    def __init__(self, fail=False):
        self.fail = fail

    def get_prompt(self, name, **kwargs):
        if self.fail:
            raise ConnectionError("Langfuse is down")
        return type("Prompt", (), {"prompt": "From Langfuse: $question", "version": 7})


def use_langfuse(monkeypatch, client):
    monkeypatch.setattr(tracing, "ENABLED", True)
    monkeypatch.setattr(tracing, "get_client", lambda: client, raising=False)


def test_with_langfuse_the_prompt_comes_from_langfuse(monkeypatch):
    use_langfuse(monkeypatch, FakeLangfuse())
    assert render("chat_answer", question="When?") == "From Langfuse: When?"
    assert tracing.prompt_tag() == "chat_answer@v7"


def test_if_langfuse_is_down_the_app_fails_loudly(monkeypatch):
    use_langfuse(monkeypatch, FakeLangfuse(fail=True))
    with pytest.raises(GatewayError, match="could not be loaded from Langfuse"):
        render("chat_answer", question="When?")


def test_without_langfuse_the_local_copy_is_used(monkeypatch):
    monkeypatch.setattr(tracing, "ENABLED", False)
    assert "contract assistant" in render("chat_answer", clauses="c", question="q")


def test_the_gateway_call_carries_the_prompt_version(monkeypatch):
    sent = {}
    message = type("M", (), {"content": "ok"})
    reply = type("R", (), {"choices": [type("C", (), {"message": message})]})

    class Client:
        chat = completions = property(lambda self: self)

        def create(self, **kwargs):
            sent.update(kwargs)
            return reply

    monkeypatch.setattr(gateway, "_client", lambda base_url: Client())
    monkeypatch.setattr(gateway, "prompt_tag", lambda: "chat_answer@v7")
    gateway.chat("analyst", "hello")
    assert sent["extra_headers"] == {"x-paynest-prompt": "chat_answer@v7"}


def test_the_prompt_label_is_a_setting():
    assert settings()["prompts"]["label"] == "production"
