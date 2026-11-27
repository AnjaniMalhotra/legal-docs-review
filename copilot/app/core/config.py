"""Loads settings.yaml, the standards, prompt templates and environment variables.

Every tunable value comes from config/, prompts/ or the environment.
Prompts are files, not strings in code, so they can be tuned without code changes.
Big idea: no settings hard-coded in Python. They live in YAML files; the code asks these functions for them.
"""
import os
from functools import lru_cache
from pathlib import Path
from string import Template

import yaml

ROOT = Path(__file__).resolve().parents[2]  # the copilot/ folder
CONFIG_DIR = ROOT / "config"
PROMPTS_DIR = ROOT / "prompts"


# In:  base     = {"analyst": {"model": "qwen2.5:7b-instruct", "temperature": 0}}
#      override = {"analyst": {"model": "ollama/qwen2.5:7b-instruct"}}
# Out: {"analyst": {"model": "ollama/qwen2.5:7b-instruct", "temperature": 0}}   <- only the model changed
def _merge(base: dict, override: dict) -> dict:
    """Deep-merge `override` into `base` (dicts merge, everything else replaces)."""
    out = dict(base)
    for key, value in override.items():
        out[key] = _merge(out[key], value) if isinstance(value, dict) and isinstance(out.get(key), dict) else value
    return out


# In:  nothing (reads config/settings.yaml, and the profile named in SETTINGS_PROFILE)
# Out: {"app": {...}, "models": {"analyst": {"model": "qwen2.5:7b-instruct", "temperature": 0,
#       "max_tokens": 700, "timeout_s": 600}, "embed": {...}}}
#      With SETTINGS_PROFILE=gateway, the analyst model is "ollama/qwen2.5:7b-instruct" instead.
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


# Used from step 3 (config/standards/ arrives then; on step 1 this returns []).
# In:  nothing (reads every config/standards/P*.yaml)
# Out: [{"id": "P1", "title": "Limitation of Liability", ...}, ..., {"id": "P10", ...}]
@lru_cache
def standards() -> list[dict]:
    """All standards (one YAML file per rule), ordered by id (P1..P10)."""
    rules = []
    for path in sorted((CONFIG_DIR / "standards").glob("*.yaml")):
        with open(path, encoding="utf-8") as f:
            rules.append({k: v.strip() if isinstance(v, str) else v for k, v in yaml.safe_load(f).items()})
    return sorted(rules, key=lambda r: int(r["id"][1:]))


# Used from step 3.
# In:  "P4"
# Out: {"id": "P4", "title": "Service Levels and Service Credits", "weight": 4, "critical": False, ...}
def rule(rule_id: str) -> dict:
    """One standard by id, e.g. rule("P4")."""
    return next(r for r in standards() if r["id"] == rule_id)


# In:  "BIFROST_URL", "http://localhost:11434/v1"
# Out: "http://127.0.0.1:8080/v1" if BIFROST_URL is set, else the default "http://localhost:11434/v1"
#      env("NOT_SET") -> None
def env(name: str, default: str | None = None) -> str | None:
    """Read an environment variable."""
    return os.getenv(name, default)


# Used from step 2 (uploads).
# In:  "uploads"
# Out: Path("copilot/data/uploads")   <- the folder is created if it does not exist
def data_dir(*parts: str) -> Path:
    """Path inside the data directory, created on demand."""
    base = Path(env("DATA_DIR") or ROOT / settings()["app"]["data_dir"])
    path = base.joinpath(*parts)
    path.mkdir(parents=True, exist_ok=True)
    return path


# Used from step 2 (prompts/ arrives then).
# In:  "chat_answer"
# Out: the text of prompts/chat_answer.md, read once and remembered
@lru_cache
def _template(name: str) -> Template:
    """Load a prompt file once and cache it."""
    return Template((PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8"))


# Used from step 2.
# In:  "chat_answer", question="What is the liability cap?"   (the file contains "Question: $question")
# Out: "...Question: What is the liability cap?..."   <- $question is filled in
def render(name: str, **values) -> str:
    """Render prompts/<name>.md, filling $placeholders. Values are inserted as-is (never re-parsed)."""
    return _template(name).safe_substitute(**{k: str(v) for k, v in values.items()})


# Used from step 2.
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
