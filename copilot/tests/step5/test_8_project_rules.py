"""The golden rules in CLAUDE.md, checked by a test instead of by memory."""
import re
import sys

from app.core.config import ROOT

APP_FILES = list((ROOT / "app").rglob("*.py"))
WEB_FILES = list((ROOT / "web").rglob("*.html")) + list((ROOT / "web").rglob("*.js"))


def read(path):
    return path.read_text(encoding="utf-8")


def test_no_code_file_is_over_120_lines():
    for path in APP_FILES + WEB_FILES:
        assert len(read(path).splitlines()) <= 120, path.name


def test_the_app_never_names_a_model():
    for path in APP_FILES:
        assert "qwen2.5" not in read(path) and "llama3.1" not in read(path), path.name


def test_only_the_gateway_uses_the_model_client():
    users = [path.name for path in APP_FILES if "from openai" in read(path)]
    assert users == ["gateway.py"]


def test_the_web_page_loads_nothing_from_the_internet():
    for path in WEB_FILES:
        links = re.findall(r"https?://[\w.-]+", read(path))
        assert [link for link in links if "www.w3.org" not in link] == [], path.name


def test_the_policy_document_matches_the_standards():
    sys.path.insert(0, str(ROOT / "scripts"))
    import build_policy_doc
    published = read(ROOT.parent / "policies" / "PayNest_Contracting_Standards.md")
    assert published.split() == build_policy_doc.build().split()
