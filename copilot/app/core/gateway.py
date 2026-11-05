"""The only door to the models: an OpenAI-compatible client pointed at Bifrost.

Callers pass a ROLE (analyst, judge, embed). The role -> model map comes from
settings.yaml, so code never names a model. BIFROST_URL points at Bifrost
(gateway profile) or straight at Ollama; both speak the same OpenAI-compatible API.
There is no fallback model: a failure raises GatewayError (fail loudly).
"""
from functools import lru_cache

from openai import OpenAI

from app.core.config import env, settings
from app.core.errors import GatewayError
from app.core.tracing import prompt_tag, traced


@lru_cache
def _client(base_url: str) -> OpenAI:
    # Local gateway: no real key needed, but the SDK requires a value.
    """One OpenAI-compatible client per base URL."""
    return OpenAI(base_url=base_url, api_key=env("GATEWAY_API_KEY", "local"))


def _role(role: str) -> dict:
    """The settings block for a role (analyst, judge, embed)."""
    return settings()["models"][role]


@traced("llm.chat")
def chat(role: str, prompt: str, json_mode: bool = False) -> str:
    """Send one user prompt to the model behind `role` and return the text."""
    cfg = _role(role)
    kwargs = {
        "model": cfg["model"],
        "messages": [{"role": "user", "content": prompt}],
        "temperature": cfg["temperature"],
        "max_tokens": cfg["max_tokens"],
        "timeout": cfg["timeout_s"],
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    if prompt_tag():
        kwargs["extra_headers"] = {"x-paynest-prompt": prompt_tag()}   # shows in the Bifrost logs
    try:
        resp = _client(env("BIFROST_URL")).chat.completions.create(**kwargs)
    except Exception as exc:  # surfaced loudly to the UI and the trace
        raise GatewayError(f"Model role '{role}' failed: {exc}") from exc
    return (resp.choices[0].message.content or "").strip()


@traced("llm.embed")
def embed(texts: list[str]) -> list[list[float]]:
    """Embed texts with the embed role (via Bifrost unless EMBED_BASE_URL is set)."""
    cfg = _role("embed")
    base = env(cfg["base_url_env"]) or env("BIFROST_URL")
    try:
        resp = _client(base).embeddings.create(model=cfg["model"], input=texts)
    except Exception as exc:
        raise GatewayError(f"Model role 'embed' failed: {exc}") from exc
    return [d.embedding for d in resp.data]
