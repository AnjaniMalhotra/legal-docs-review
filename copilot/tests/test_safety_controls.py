"""The two safety controls after the model reads a clause.

Grounding guard: catches invented quotes and tolerates PDF formatting.
Red-flag tripwire: escalates walk-away drafting the model missed, and never clears anything.
"""
from app.core.config import rule
from app.policy import checks
from app.policy.grounding import apply_guard, locate_quote
from app.policy.scoring import NEEDS_REVIEW

# ---- Grounding guard -------------------------------------------------------

PAGES = [
    "1. DEFINITIONS\n\"Client Data\" means all data supplied by the Client.",
    "9. SECURITY INCIDENTS\nProvider shall notify Client immediately upon becoming\naware of any Security Incident.",
    "14. LIABILITY\nNotwithstanding anything in this Agreement, Provider’s liability\nfor any data breach shall be unlimited.",
]


def _finding(quote: str, page: int | None = None, status: str = "Conflicting") -> dict:
    return {"rule_id": "P1", "status": status, "evidence_quote": quote, "page": page}


def test_exact_quote_across_line_break_is_grounded():
    out = apply_guard(_finding("Provider shall notify Client immediately upon becoming aware of any Security Incident.", 2), PAGES)
    assert out["grounded"] is True and out["status"] == "Conflicting" and out["page"] == 2


def test_curly_quotes_and_case_are_normalised():
    out = apply_guard(_finding("provider's liability for any data breach shall be unlimited", 3), PAGES)
    assert out["grounded"] is True


def test_wrong_page_is_corrected():
    out = apply_guard(_finding("Provider's liability for any data breach shall be unlimited.", 1), PAGES)
    assert out["page"] == 3


def test_invented_quote_becomes_needs_review():
    out = apply_guard(_finding("Provider's liability is capped at twelve months of fees.", 3, "Compliant"), PAGES)
    assert out["grounded"] is False
    assert out["status"] == "Needs review" and out["llm_status"] == "Compliant"


def test_quote_split_by_a_page_break_is_grounded():
    pages = ["14.1 Notwithstanding anything in this Agreement, Provider's liability\nAgreement footer - Page 6 of 9",
             "PRIVILEGED AND CONFIDENTIAL | DRAFT\nfor any data breach shall be unlimited.\n14.2 Next clause."]
    quote = "Notwithstanding anything in this Agreement, Provider's liability for any data breach shall be unlimited."
    assert locate_quote(quote, pages, None) == 1


def test_empty_quote_is_not_grounded():
    assert locate_quote("", PAGES, 1) is None


def test_missing_needs_no_quote():
    out = apply_guard(_finding("", None, "Missing"), PAGES)
    assert out["grounded"] is None and out["status"] == "Missing"



def test_our_citation_label_is_not_part_of_the_quote():
    # Real 7B outputs: correct words, but our [p.N, heading] label copied in (start, end, odd brackets).
    for quote in ["[p.3, 14. LIABILITY] Provider's liability for any data breach shall be unlimited.",
                  '"Provider shall notify Client immediately upon becoming aware of any Security Incident.", [p.2, 9. SECURITY}',
                  "Provider's liability for any data breach shall be unlimited. (p.3, 14. LIABILITY)"]:
        out = apply_guard(_finding(quote, 1), PAGES)
        assert out["grounded"] is True and "p." not in out["evidence_quote"]


def test_label_does_not_rescue_invented_words():
    out = apply_guard(_finding("[p.3, 14. LIABILITY] Provider's liability is capped at fees.", 3, "Compliant"), PAGES)
    assert out["grounded"] is False and out["status"] == "Needs review"

# ---- Red-flag tripwire -----------------------------------------------------

LIABILITY = [{"text": "15.1 Notwithstanding anything to the contrary in this Agreement, the Service Provider's "
                      "liability for any Data Breach shall be unlimited. 15.2 Subject to Clause 15.1, ...",
              "page": 6, "heading": "15.1 LIMITATION OF LIABILITY"}]


def _rf_finding(status: str) -> dict:
    return {"rule_id": "P1", "status": status, "llm_status": status, "evidence_quote": "", "reason": "model"}


def test_missed_red_line_is_escalated_with_evidence():
    out = checks.red_flag(_rf_finding("Partial"), rule("P1"), LIABILITY)
    assert out["status"] == NEEDS_REVIEW and out["red_flag"] == "unlimited"
    assert out["evidence_quote"].endswith("shall be unlimited.") and out["page"] == 6


def test_conflicting_is_left_alone():
    assert checks.red_flag(_rf_finding("Conflicting"), rule("P1"), LIABILITY)["status"] == "Conflicting"


def test_no_red_flag_no_change():
    clean = [{"text": "Each Party's liability shall not exceed the Fees paid in twelve (12) months.",
              "page": 6, "heading": "15.2 LIMITATION OF LIABILITY"}]
    assert checks.red_flag(_rf_finding("Compliant"), rule("P1"), clean)["status"] == "Compliant"


def test_red_flag_outside_the_rules_subject_is_ignored():
    # Lexmore trap: "immediately" about invoices must not trip the breach-notice rule (P3).
    invoice = [{"text": "4.3 The Parties shall notify each other immediately of any invoice discrepancy.",
                "page": 3, "heading": "4. FEES, INVOICING AND PAYMENT"}]
    assert checks.red_flag(_rf_finding("Compliant") | {"rule_id": "P3"}, rule("P3"), invoice)["status"] == "Compliant"


def test_red_flag_on_the_rules_subject_still_escalates():
    breach = [{"text": "9.3 The Service Provider shall notify the Client immediately upon becoming aware of any "
                       "Security Incident affecting Client Data.", "page": 5, "heading": "9. SECURITY INCIDENTS"}]
    out = checks.red_flag(_rf_finding("Compliant") | {"rule_id": "P3"}, rule("P3"), breach)
    assert out["status"] == NEEDS_REVIEW and out["red_flag"] == "immediately"
