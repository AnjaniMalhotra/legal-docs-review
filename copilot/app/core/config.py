"""Loads settings.yaml, prompt templates and environment variables.

Every tunable value comes from config/, prompts/ or the environment.
Big idea: no settings hard-coded in Python. They live in YAML files; the code asks these functions for them.
Prompts are files too, so they can be tuned without code changes.
"""
import os
from functools import lru_cache
from pathlib import Path
from string import Template

import yaml

ROOT = Path(__file__).resolve().parents[2]  # the copilot/ folder
CONFIG_DIR = ROOT / "config"
PROMPTS_DIR = ROOT / "prompts"              # new in step 2


# In:  base     = {"analyst": {"model": "<model>", "temperature": 0}}
#      override = {"analyst": {"model": "ollama/<model>"}}
# Out: {"analyst": {"model": "ollama/<model>", "temperature": 0}}   <- only the model changed
def _merge(base: dict, override: dict) -> dict:
    """Deep-merge `override` into `base` (dicts merge, everything else replaces)."""
    out = dict(base)
    for key, value in override.items():
        out[key] = _merge(out[key], value) if isinstance(value, dict) and isinstance(out.get(key), dict) else value
    return out


# In:  nothing (reads config/settings.yaml, and the profile named in SETTINGS_PROFILE)
# Out: {"app": {...}, "models": {"analyst": {"model": "<model>", ...}, "embed": {...}},
#       "retrieval": {"top_k_chat": 5, ...}, "summary": {...}}
#      With SETTINGS_PROFILE=gateway, the analyst model is "ollama/<model>" instead.
@lru_cache
def settings() -> dict:
    """settings.yaml, optionally overlaid by config/profiles/<SETTINGS_PROFILE>.yaml."""
    with open(CONFIG_DIR / "settings.yaml", encoding="utf-8") as f:
        base = yaml.safe_load(f)
    profile = os.getenv("SETTINGS_PROFILE")
    if not profile:
        return base
    with open(CONFIG_DIR / "profiles" / f"{profile}.yaml", encoding="utf-8") as f:
        return _merge(base, yaml.safe_load(f) or {})


# In:  "BIFROST_URL", "http://localhost:11434/v1"
# Out: "http://127.0.0.1:8080/v1" if BIFROST_URL is set, else the default "http://localhost:11434/v1"
#      env("NOT_SET") -> None
def env(name: str, default: str | None = None) -> str | None:
    """Read an environment variable."""
    return os.getenv(name, default)


# New in step 2: where uploads and vectors are kept.
# In:  "uploads"
# Out: Path("copilot/data/uploads")   <- the folder is created if it does not exist
def data_dir(*parts: str) -> Path:
    """Path inside the data directory, created on demand."""
    base = Path(env("DATA_DIR") or ROOT / settings()["app"]["data_dir"])
    path = base.joinpath(*parts)
    path.mkdir(parents=True, exist_ok=True)
    return path


# New in step 2.
# In:  "chat_answer"
# Out: the text of prompts/chat_answer.md, read once and remembered
@lru_cache
def _template(name: str) -> Template:
    """Load a prompt file once and cache it."""
    return Template((PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8"))


# New in step 2: fills the $placeholders in a prompt file.
# In:  "chat_answer", clauses="[p.7, 15.1 LIABILITY]\nCapped at 12 months of Fees.",
#      question="What is the liability cap?"
# Out: "...Contract clauses:\n[p.7, 15.1 LIABILITY]\nCapped at 12 months of Fees.\n\nQuestion: What is the liability cap?\n"
def render(name: str, **values) -> str:
    """Render prompts/<name>.md, filling $placeholders. Values are inserted as-is (never re-parsed)."""
    return _template(name).safe_substitute(**{k: str(v) for k, v in values.items()})


# New in step 2: turns search results into the text block the prompt expects.
# In:  [{"page": 3, "heading": "5.1 SERVICE LEVELS", "text": "Availability of 99.5%."},
#       {"page": 7, "heading": "", "text": "Fees are not refunded."}]
# Out: "[p.3, 5.1 SERVICE LEVELS]\nAvailability of 99.5%.\n\n[p.7, untitled]\nFees are not refunded."
#      An empty list -> "(no clauses retrieved)"
def format_clauses(chunks: list[dict]) -> str:
    """Turn retrieved chunks into the text block the prompts expect."""
    if not chunks:
        return "(no clauses retrieved)"
    return "\n\n".join(
        f"[p.{c['page']}, {c['heading'] or 'untitled'}]\n{c['text']}" for c in chunks
    )
