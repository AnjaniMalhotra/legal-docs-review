"""The API refuses bad input with a clear error."""
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)


def test_only_pdf_files_can_be_uploaded():
    files = {"file": ("contract.docx", b"data")}
    assert client.post("/api/documents", files=files).status_code == 400


def test_a_file_over_the_size_limit_is_refused(monkeypatch):
    monkeypatch.setitem(settings()["app"], "max_upload_mb", 0)
    files = {"file": ("contract.pdf", b"data")}
    assert client.post("/api/documents", files=files).status_code == 413


def test_a_one_letter_question_is_refused():
    body = {"doc_id": "doc-1", "question": "x"}
    assert client.post("/api/ask", json=body).status_code == 422


def test_a_review_needs_a_real_reviewer_name():
    body = {"doc_id": "doc-1", "reviewer": "x"}
    assert client.post("/api/policy/reviews", json=body).status_code == 422


def test_an_unknown_document_is_404():
    assert client.get("/api/documents/doc-missing").status_code == 404


def test_an_unknown_review_is_404():
    url = "/api/policy/reviews/rev-missing/decisions"
    assert client.post(url, json={"decisions": []}).status_code == 404
