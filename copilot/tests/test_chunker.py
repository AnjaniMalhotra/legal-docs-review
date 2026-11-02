"""Clause chunking keeps headings and page numbers, and ignores numbered sentences."""
from app.ingest.chunker import chunk_pages

PAGE_1 = """PAYROLL SERVICES AGREEMENT
1. Definitions
In this Agreement, Client Data means all employee data supplied by the Client to the Provider.
9.2 Security Incidents
Provider shall notify Client immediately upon becoming aware of any Security Incident."""

PAGE_2 = """affecting Client Data, including details of the affected employees.
14.1 Limitation of Liability
30 days after the end of each quarter the parties shall meet to review service performance and invoices.
Provider's liability for any data breach shall be unlimited."""


def test_chunks_follow_clause_headings_and_pages():
    chunks = chunk_pages([PAGE_1, PAGE_2])
    headings = [(c["page"], c["heading"]) for c in chunks]
    assert (1, "1 Definitions") in headings
    assert (1, "9.2 Security Incidents") in headings
    assert (2, "14.1 Limitation of Liability") in headings


def test_clause_running_over_a_page_break_stays_one_chunk():
    chunks = chunk_pages([PAGE_1 + "\nPage 1 of 2", "PRIVILEGED AND CONFIDENTIAL | DRAFT\n" + PAGE_2])
    clause = next(c for c in chunks if c["heading"] == "9.2 Security Incidents")
    assert clause["page"] == 1                                  # cited from the page it starts on
    assert "affecting Client Data" in clause["text"]            # continuation joined in
    assert "Page 1 of 2" not in clause["text"] and "PRIVILEGED" not in clause["text"]


def test_numbered_sentence_is_not_a_heading():
    chunks = chunk_pages([PAGE_1, PAGE_2])
    assert not any(c["heading"].startswith("30 ") for c in chunks)
    liability = next(c for c in chunks if c["heading"] == "14.1 Limitation of Liability")
    assert "unlimited" in liability["text"]


def test_schedules_are_their_own_sections():
    page = "21.6 Counterparts. This Agreement may be executed in counterparts.\n" \
           "SCHEDULE 3 - SERVICE LEVELS AND SERVICE CREDITS\nAvailability shall be calculated monthly as set out below."
    chunks = chunk_pages([page])
    assert chunks[-1]["heading"] == "Schedule 3 SERVICE LEVELS AND SERVICE CREDITS"
    assert "Availability" not in chunks[0]["text"]       # schedule text no longer filed under clause 21.6


def test_long_clause_is_split_with_ids():
    long_page = "5. Services\n" + " ".join(["The Provider shall process payroll accurately."] * 80)
    chunks = chunk_pages([long_page])
    assert len(chunks) > 1
    assert all(c["heading"] == "5 Services" for c in chunks)
    assert len({c["chunk_id"] for c in chunks}) == len(chunks)
