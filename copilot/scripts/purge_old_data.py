"""Retention job: delete uploaded contracts and their vectors after retention_days,
and final reports after report_retention_days (both from settings.yaml).

Usage (e.g. daily cron):  make purge
"""
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import data_dir, settings  # noqa: E402
from app.ingest import vector_store  # noqa: E402


def _older_than(path: Path, days: int) -> bool:
    modified = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    return modified < datetime.now(timezone.utc) - timedelta(days=days)


def purge() -> dict:
    cfg = settings()["app"]
    removed = {"documents": 0, "reports": 0}
    for doc in data_dir("documents").glob("*.json"):
        if _older_than(doc, cfg["retention_days"]):
            doc_id = json.loads(doc.read_text(encoding="utf-8"))["doc_id"]
            vector_store.delete(doc_id)
            (data_dir("summaries") / f"{doc_id}.json").unlink(missing_ok=True)
            doc.unlink()
            removed["documents"] += 1
    for report in data_dir("reports").glob("*.json"):
        if _older_than(report, cfg["report_retention_days"]):
            report.unlink()
            removed["reports"] += 1
    return removed


if __name__ == "__main__":
    print(f"Purged: {purge()}")
