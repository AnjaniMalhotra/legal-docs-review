"""Test on the real sample PDFs, not on made-up text."""
from app.core.config import ROOT
from app.ingest.chunker import chunk_pages
from app.ingest.ingest_service import extract_pages
from app.policy.grounding import locate_quote
from app.policy.scoring import compute

CAREWELL = ROOT / "sample_contracts" / "01_carewell_hospitals.pdf"


def carewell_pages():
    return extract_pages(CAREWELL.read_bytes())


def test_a_real_quote_is_found_on_the_right_page():
    quote = "the Service Provider's liability for any Data Breach shall be unlimited"
    assert locate_quote(quote, carewell_pages(), None) == 6


def test_a_made_up_quote_is_not_found():
    quote = "the Service Provider's liability for any Data Breach is capped at twelve months"
    assert locate_quote(quote, carewell_pages(), None) is None


def test_carewell_becomes_74_clauses():
    assert len(chunk_pages(carewell_pages())) == 74


def test_page_footers_are_not_in_the_clauses():
    for clause in chunk_pages(carewell_pages()):
        assert "PRIVILEGED AND CONFIDENTIAL" not in clause["text"]


def test_the_answer_key_scores_add_up(golden):
    for contract in golden["contracts"]:
        findings = [{"rule_id": rule, "status": status} for rule, status in contract["labels"].items()]
        result = compute(findings)
        assert result["score"] == contract["expected_score"]
        assert result["band"] == contract["expected_band"]
