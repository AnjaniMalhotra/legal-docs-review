"""The numeric check reads periods and percentages in verified quotes, and only ever makes a finding stricter."""
from app.core.config import rule
from app.policy import checks


def _finding(rule_id: str, status: str, quote: str, grounded: bool = True) -> dict:
    return {"rule_id": rule_id, "status": status, "llm_status": status, "evidence_quote": quote,
            "grounded": grounded, "reason": "Model reason."}


def test_uptime_marked_ok_becomes_acceptable():
    # CareWell P4: the 7B model called 99.9% availability Compliant; the standard says 99.9% is the fallback.
    out = checks.numbers(_finding("P4", "Compliant", "The Service Provider shall ensure 99.9% monthly "
                                                          "availability of the Platform"), rule("P4"))
    assert out["status"] == "Partial" and out["numeric_value"] == 99.9 and "99.9 % availability" in out["reason"]


def test_sixty_day_payment_marked_ok_becomes_acceptable():
    # Northstar P8: the model called 60-day payment Compliant.
    out = checks.numbers(_finding("P8", "Compliant", "Each invoice shall be payable within sixty (60) days "
                                                          "of the invoice date."), rule("P8"))
    assert out["status"] == "Partial"


def test_ninety_day_payment_becomes_not_acceptable():
    out = checks.numbers(_finding("P8", "Partial", "payable within ninety (90) days of receipt"), rule("P8"))
    assert out["status"] == "Conflicting"


def test_super_cap_uses_the_larger_number():
    quote = "shall not exceed the Fees paid in the twelve (12) months, save that ... the twenty-four (24) months"
    assert checks.numbers(_finding("P1", "Compliant", quote), rule("P1"))["status"] == "Partial"


def test_breach_notice_uses_the_shorter_window():
    quote = "notify the Client within twelve (12) hours of confirming ... a written report within seventy-two (72) hours"
    assert checks.numbers(_finding("P3", "Compliant", quote), rule("P3"))["status"] == "Partial"


def test_never_makes_a_finding_milder():
    # 30 days is Compliant for P8, but the model's stricter Partial stands (other conditions may fail).
    out = checks.numbers(_finding("P8", "Partial", "payable within thirty (30) days"), rule("P8"))
    assert out["status"] == "Partial" and "numeric_value" not in out


def test_ignores_unverified_quotes_missing_numbers_and_rules_without_a_check():
    assert checks.numbers(_finding("P8", "Compliant", "within ninety (90) days", grounded=False),
                               rule("P8"))["status"] == "Compliant"
    assert checks.numbers(_finding("P8", "Compliant", "payable promptly"), rule("P8"))["status"] == "Compliant"
    assert checks.numbers(_finding("P10", "Compliant", "within ninety (90) days"), rule("P10"))["status"] == "Compliant"


def test_plain_digits_are_read_too():
    # Meridian 12.2 (unseen contract): "36 months" without "(36)" was rated Acceptable by the model.
    quote = "the Service Provider's total liability shall not exceed the Fees paid or payable in the 36 months"
    out = checks.numbers(_finding("P1", "Partial", quote), rule("P1"))
    assert out["status"] == "Conflicting" and "the AI said acceptable" in out["reason"]
    assert checks.numbers(_finding("P8", "Partial", "within 75 days of receipt"), rule("P8"))["status"] == "Conflicting"
