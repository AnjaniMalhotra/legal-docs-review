"""Loads settings.yaml, the standards, prompt templates and environment variables.

Every tunable value comes from config/, Langfuse or the environment.
Prompts are versioned in self-hosted Langfuse, so they can be tuned without code changes.
prompts/*.md is the starting copy: scripts/push_prompts.py loads it into Langfuse.
"""
import os
from functools import lru_cache
from pathlib import Path
from string import Template

import yaml

from app.core import tracing

ROOT = Path(__file__).resolve().parents[2]
CONFIG_DIR = ROOT / "config"
PROMPTS_DIR = ROOT / "prompts"


def _merge(base: dict, override: dict) -> dict:
    """Deep-merge `override` into `base` (dicts merge, everything else replaces)."""
    out = dict(base)
    for key, value in override.items():
        out[key] = _merge(out[key], value) if isinstance(value, dict) and isinstance(out.get(key), dict) else value
    return out


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


@lru_cache
def standards() -> list[dict]:
    """All standards (one YAML file per rule), ordered by id (P1..P10)."""
    rules = []
    for path in sorted((CONFIG_DIR / "standards").glob("*.yaml")):
        with open(path, encoding="utf-8") as f:
            rules.append({k: v.strip() if isinstance(v, str) else v for k, v in yaml.safe_load(f).items()})
    return sorted(rules, key=lambda r: int(r["id"][1:]))


def rule(rule_id: str) -> dict:
    """One standard by id, e.g. rule("P4")."""
    return next(r for r in standards() if r["id"] == rule_id)


def env(name: str, default: str | None = None) -> str | None:
    """Read an environment variable."""
    return os.getenv(name, default)


def data_dir(*parts: str) -> Path:
    """Path inside the data directory, created on demand."""
    base = Path(env("DATA_DIR") or ROOT / settings()["app"]["data_dir"])
    path = base.joinpath(*parts)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _prompt_text(name: str) -> str:
    """The prompt from Langfuse, where its versions are kept. Only without Langfuse (unit tests): the local file."""
    if tracing.ENABLED:
        cfg = settings()["prompts"]
        return tracing.fetch_prompt(name, cfg["label"], cfg["cache_ttl_s"])
    return (PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8")


def render(name: str, **values) -> str:
    """Fill a prompt's $placeholders. Values are inserted as-is (never re-parsed)."""
    return Template(_prompt_text(name)).safe_substitute(**{k: str(v) for k, v in values.items()})


def format_clauses(chunks: list[dict]) -> str:
    """Turn retrieved chunks into the text block the prompts expect."""
    if not chunks:
        return "(no clauses retrieved)"
    return "\n\n".join(
        f"[p.{c['page']}, {c['heading'] or 'untitled'}]\n{c['text']}" for c in chunks
    )
