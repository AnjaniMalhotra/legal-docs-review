"""Splits contract pages into clause-level chunks.

A new chunk starts at a numbered heading such as "14.1 Limitation of Liability"
or "9. CONFIDENTIALITY". Each chunk keeps its page number and heading, so every
answer can cite where it came from. Long clauses are split with a small overlap.
"""
import re

from app.core.config import settings

# "14.1 Limitation of Liability", "9. CONFIDENTIALITY", "Clause 7 - Audit"
HEADING = re.compile(r"^\s*(?i:clause\s+)?(\d{1,2}(?:\.\d{1,2}){0,3})[.)]?\s+[-–:]?\s*([A-Z][^\n]{2,200})$")
# "SCHEDULE 3 - SERVICE LEVELS AND SERVICE CREDITS" (schedules have no clause numbers)
SCHEDULE = re.compile(r"^\s*(SCHEDULE\s+\d{1,2})\s*[-–:]?\s*([A-Z][^\n]{2,120})?$", re.I)
MAX_HEADING_WORDS = 10


def _heading(line: str) -> tuple[str, str, str] | None:
    """("title", "14", "Limitation of Liability") for a section heading,
    ("sub", "14.1", "Notwithstanding ...") for a numbered sub-clause, else None."""
    schedule = SCHEDULE.match(line)
    if schedule:
        return "title", schedule.group(1).title(), (schedule.group(2) or "").strip()
    match = HEADING.match(line)
    if not match:
        return None
    number, text = match.group(1), match.group(2).strip()
    if text[-1] not in ".,;:" and len(text.split()) <= MAX_HEADING_WORDS:
        return "title", number, text
    if "." in number:  # "9.2 Provider shall ..." starts a sub-clause; "30 days ..." is just a sentence
        return "sub", number, text
    return None


def _split_long(text: str, max_chars: int, overlap: int) -> list[str]:
    """Split text longer than max_chars into overlapping parts."""
    if len(text) <= max_chars:
        return [text]
    parts, start = [], 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        cut = text.rfind(". ", start, end)
        end = cut + 1 if cut > start + max_chars // 2 and end < len(text) else end
        parts.append(text[start:end].strip())
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return parts


def is_page_furniture(line: str) -> bool:
    """Running headers, footers and page numbers (patterns from settings.yaml)."""
    patterns = settings()["retrieval"].get("ignore_line_patterns", [])
    return any(re.match(p, line.strip(), re.I) for p in patterns)


def _add_clause(chunks: list[dict], lines: list[str], page: int, clause_no: str, heading: str, cfg: dict) -> None:
    """Append one clause to chunks, split into overlapping parts if it is too long."""
    text = " ".join(" ".join(lines).split())
    if len(text) < cfg["min_chunk_chars"]:
        return
    for part in _split_long(text, cfg["chunk_max_chars"], cfg["chunk_overlap_chars"]):
        chunks.append({
            "chunk_id": f"c{len(chunks) + 1:04d}",
            "page": page,
            "clause_no": clause_no,
            "heading": f"{clause_no} {heading}".strip(),
            "text": part,
        })


def chunk_pages(pages: list[str]) -> list[dict]:
    """Return chunks: {chunk_id, page, clause_no, heading, text}.

    A clause that runs over a page break stays one chunk, cited from the page it starts on.
    """
    cfg = settings()["retrieval"]
    chunks: list[dict] = []
    clause_no, heading, section = "", cfg["preamble_heading"], ""  # text before clause 1 = preamble
    buffer: list[str] = []
    start_page = 1

    for page_no, page_text in enumerate(pages, start=1):
        for line in page_text.splitlines():
            if is_page_furniture(line):
                continue
            found = _heading(line)
            if found:
                _add_clause(chunks, buffer, start_page, clause_no, heading, cfg)
                kind, clause_no, text = found
                if kind == "title":
                    section = text
                heading = text if kind == "title" else section  # sub-clauses keep the section title
                buffer, start_page = [line.strip()], page_no
            elif line.strip():
                buffer.append(line.strip())
    _add_clause(chunks, buffer, start_page, clause_no, heading, cfg)
    return chunks
