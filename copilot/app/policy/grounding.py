"""Grounding guard: the single most important anti-hallucination control.

Every finding that claims a clause exists must quote it word for word. If the
quote is not in the PDF text, the finding becomes "Needs review". Only
whitespace, quote marks, dashes and letter case are normalised (PDF extraction
breaks lines and curls quotes); the words themselves must match exactly.
Our own citation label ("[p.6, 15.1 LIABILITY]"), which some models copy into the
quote, is removed from its start or end first: it is our formatting, not contract text.
"""
import re

from app.ingest.chunker import is_page_furniture
from app.policy.scoring import NEEDS_REVIEW

QUOTED_STATUSES = ("Compliant", "Partial", "Conflicting", "N/A")
_LABEL = r"[\[(]\s*p\.\s*\d+[^\[\]()]*[\])}]"   # [p.6, heading] or (p.11, heading)
_EDGE_LABEL = re.compile(rf"^\s*{_LABEL}|{_LABEL}\s*$", re.I)
_TRANSLATE = str.maketrans({"‘": "'", "’": "'", "“": '"', "”": '"', "–": "-", "—": "-", " ": " "})


def normalise(text: str) -> str:
    text = text.translate(_TRANSLATE).lower()
    text = re.sub(r"-\s*\n\s*", "-", text)         # "non-\ndisclosure" -> "non-disclosure"
    return " ".join(text.split())


def strip_label(quote: str) -> str:
    """Quote without our citation label at its start or end, and without wrapping quote marks."""
    return _EDGE_LABEL.sub("", quote or "").strip(" ,;\"'“”")


def _body(page: str) -> str:
    """Page text without running headers, footers and page numbers."""
    return "\n".join(line for line in page.splitlines() if not is_page_furniture(line))


def locate_quote(quote: str, pages: list[str], cited_page: int | None) -> int | None:
    """Return the page (1-based) where the quote starts, preferring the cited page.

    Clauses often run over a page break, so each page is also checked joined to the next.
    """
    needle = normalise(strip_label(quote)).strip(" .\"'")
    if not needle:
        return None
    bodies = [normalise(_body(p)) for p in pages]
    order = list(range(1, len(pages) + 1))
    if cited_page and 1 <= cited_page <= len(pages):
        order.remove(cited_page)
        order.insert(0, cited_page)
    for page_no in order:
        if needle in bodies[page_no - 1]:
            return page_no
    for page_no in range(1, len(pages)):          # quote spanning page N and N+1
        if needle in f"{bodies[page_no - 1]} {bodies[page_no]}":
            return page_no
    return None


def apply_guard(finding: dict, pages: list[str]) -> dict:
    """Return a copy of the finding with `grounded` set and status downgraded if needed."""
    result = dict(finding)
    if finding["status"] not in QUOTED_STATUSES:
        result["grounded"] = None           # Missing / Silent (OK): nothing to verify
        return result
    quote = strip_label(finding.get("evidence_quote", ""))
    page = locate_quote(quote, pages, finding.get("page"))
    result["grounded"] = page is not None
    result["evidence_quote"] = quote
    if page is None:
        result["llm_status"] = finding["status"]
        result["status"] = NEEDS_REVIEW
    else:
        result["page"] = page               # correct a wrong page citation
    return result
