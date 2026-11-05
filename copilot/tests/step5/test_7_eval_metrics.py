"""The numbers we report are only as good as the arithmetic behind them."""
from evals import metrics


def test_accuracy():
    assert metrics.accuracy([("Partial", "Partial"), ("Partial", "Missing")]) == 0.5


def test_a_risky_clause_marked_ok_is_counted():
    assert metrics.compliant_on_risky([("Missing", "Compliant"), ("Conflicting", "Compliant")]) == 2


def test_other_mistakes_are_not_the_release_blocker():
    assert metrics.compliant_on_risky([("Conflicting", "Partial"), ("Partial", "Compliant")]) == 0


def test_pages_are_read_from_the_answer():
    assert metrics.cited_pages("Unlimited [p.6, 15.1 LIABILITY].") == {6}


def test_citing_the_wrong_page_is_a_miss():
    assert metrics.citation_hit("See [p.5, 9.3].", [6]) is False
