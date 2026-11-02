"""Loads settings.yaml, the standards, prompt templates and environment variables.

Every tunable value comes from config/, prompts/ or the environment (decision D15).
Prompts are files, not strings in code, so they can be tuned without code changes.
"""
import os
from functools import lru_cache
from pathlib import Path
from string import Template

import yaml

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
    return next(r for r in standards() if r["id"] == rule_id)


def env(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)


def data_dir(*parts: str) -> Path:
    """Path inside the data directory, created on demand."""
    base = Path(env("DATA_DIR") or ROOT / settings()["app"]["data_dir"])
    path = base.joinpath(*parts)
    path.mkdir(parents=True, exist_ok=True)
    return path


@lru_cache
def _template(name: str) -> Template:
    return Template((PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8"))


def render(name: str, **values) -> str:
    """Render prompts/<name>.md, filling $placeholders. Values are inserted as-is (never re-parsed)."""
    return _template(name).safe_substitute(**{k: str(v) for k, v in values.items()})


def format_clauses(chunks: list[dict]) -> str:
    """Turn retrieved chunks into the text block the prompts expect."""
    if not chunks:
        return "(no clauses retrieved)"
    return "\n\n".join(
        f"[p.{c['page']}, {c['heading'] or 'untitled'}]\n{c['text']}" for c in chunks
    )
