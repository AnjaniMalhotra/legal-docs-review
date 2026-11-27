"""Shared test setup: make `app` importable and isolate data in a temp folder."""
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True)
def isolated_data_dir(tmp_path, monkeypatch):
    """New in step 2: every test saves its files in its own throwaway folder, never in the real data/ folder."""
    monkeypatch.setenv("DATA_DIR", str(tmp_path))
