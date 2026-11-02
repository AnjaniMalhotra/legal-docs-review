"""Upload pipeline: PDF bytes -> pages -> clause chunks -> embeddings -> Chroma."""
from io import BytesIO

from pypdf import PdfReader

from app.core import doc_store
from app.core.errors import UnreadablePdfError
from app.core.tracing import tag_trace, traced
from app.ingest import vector_store
from app.ingest.chunker import chunk_pages


def extract_pages(pdf_bytes: bytes) -> list[str]:
    """Text of a text-based PDF, one string per page (index 0 = page 1). OCR is out of scope."""
    reader = PdfReader(BytesIO(pdf_bytes))
    pages = [(page.extract_text() or "").strip() for page in reader.pages]
    if not any(pages):
        raise UnreadablePdfError("No selectable text found. Scanned PDFs are not supported.")
    return pages


@traced("ingest")
def ingest_pdf(file_name: str, pdf_bytes: bytes) -> dict:
    pages = extract_pages(pdf_bytes)
    chunks = chunk_pages(pages)
    doc_id = doc_store.save_document(file_name, pages)
    vector_store.add_chunks(doc_id, chunks)
    tag_trace(doc_id=doc_id, file_name=file_name)
    return {"doc_id": doc_id, "file_name": file_name, "pages": len(pages), "clauses": len(chunks)}
