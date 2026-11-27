"""Loads settings.yaml and environment variables.

Every tunable value comes from config/ or the environment.
Big idea: no settings hard-coded in Python. They live in YAML files; the code asks these functions for them.
"""
import os
from functools import lru_cache
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]  # the copilot/ folder
CONFIG_DIR = ROOT / "config"


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
# Out: {"models": {"analyst": {"model": "<model>", "temperature": 0,
#       "max_tokens": 700, "timeout_s": 600}, "embed": {...}}}
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
