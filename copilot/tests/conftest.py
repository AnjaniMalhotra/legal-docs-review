"""Shared test setup: make `app` importable and isolate data in a temp folder."""
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True)
def isolated_data_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("DATA_DIR", str(tmp_path))


@pytest.fixture
def golden() -> dict:
    return json.loads((ROOT / "evals" / "golden_set.json").read_text(encoding="utf-8"))


def findings_from_labels(labels: dict) -> list[dict]:
    return [{"rule_id": rule_id, "status": status} for rule_id, status in labels.items()]
