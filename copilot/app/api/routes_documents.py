"""Endpoints about one uploaded contract.

POST /api/documents — upload one client contract PDF.
GET  /api/documents/{doc_id} — page text for the in-browser contract viewer (local only).
GET  /api/documents/{doc_id}/summary — plain-English summary of key terms (generated once, cached).
POST /api/ask — typed question about the contract, answered with citations.
Errors (unreadable PDF, unknown id, model down) are mapped to HTTP codes in app/main.py.
"""
from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.core import doc_store
from app.core.config import settings
from app.ingest.ingest_service import ingest_pdf
from app.rag import summariser
from app.rag.answerer import answer

router = APIRouter(prefix="/api", tags=["documents"])


@router.post("/documents")
async def upload(file: UploadFile) -> dict:
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Please upload a PDF file.")
    data = await file.read()
    max_mb = settings()["app"]["max_upload_mb"]
    if len(data) > max_mb * 1024 * 1024:
        raise HTTPException(413, f"File is larger than {max_mb} MB.")
    return ingest_pdf(file.filename, data)


@router.get("/documents/{doc_id}")
def get_document(doc_id: str) -> dict:
    doc = doc_store.load_document(doc_id)
    return {k: doc[k] for k in ("doc_id", "file_name", "uploaded_at", "pages")}


@router.get("/documents/{doc_id}/summary")
def get_summary(doc_id: str) -> dict:
    return summariser.summarise(doc_id)


class Question(BaseModel):
    doc_id: str
    question: str = Field(min_length=2, max_length=500)


@router.post("/ask")
def ask(q: Question) -> dict:
    return answer(q.doc_id, q.question)
