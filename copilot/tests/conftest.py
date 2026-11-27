"""Shared test setup: make `app` importable and isolate data in a temp folder."""
import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True)
def isolated_data_dir(tmp_path, monkeypatch):
    """New in step 2: every test saves its files in its own throwaway folder, never in the real data/ folder."""
    monkeypatch.setenv("DATA_DIR", str(tmp_path))


@pytest.fixture
def golden() -> dict:
    """New in step 3: the answer key for the sample contracts (expected status per rule, and score)."""
    return json.loads((ROOT / "evals" / "golden_set.json").read_text(encoding="utf-8"))


def findings_from_labels(labels: dict) -> list[dict]:
    """New in step 3: turn {"P1": "Compliant", ...} into findings, to test scoring without a model."""
    return [{"rule_id": rule_id, "status": status} for rule_id, status in labels.items()]
