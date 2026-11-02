"""Stores each uploaded contract's page text, and each final report, on local disk.

The grounding guard needs the original text to check quotes word for word.
Final reports are kept as the audit record (see report_retention_days).
Nothing here leaves the machine.
"""
import json
import uuid
from datetime import datetime, timezone

from app.core.config import data_dir
from app.core.errors import NotFoundError


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:10]}"


def save_document(file_name: str, pages: list[str]) -> str:
    doc_id = new_id("doc")
    record = {
        "doc_id": doc_id,
        "file_name": file_name,
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "pages": pages,
    }
    (data_dir("documents") / f"{doc_id}.json").write_text(json.dumps(record), encoding="utf-8")
    return doc_id


def load_document(doc_id: str) -> dict:
    path = data_dir("documents") / f"{doc_id}.json"
    if not path.exists():
        raise NotFoundError(f"Unknown document {doc_id}. Upload it again.")
    return json.loads(path.read_text(encoding="utf-8"))


def save_summary(doc_id: str, summary: dict) -> None:
    (data_dir("summaries") / f"{doc_id}.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")


def load_summary(doc_id: str) -> dict | None:
    path = data_dir("summaries") / f"{doc_id}.json"
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None


def save_report(review_id: str, report: dict) -> None:
    (data_dir("reports") / f"{review_id}.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
