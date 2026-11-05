"""Writes PayNest's company policy, the Contracting Standards, as a readable document.

The standards YAML in config/standards/ is what the app enforces. This script turns it into
policies/PayNest_Contracting_Standards.md so lawyers and students read exactly the same rules.
Run it after changing any standard:  .venv/bin/python scripts/build_policy_doc.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import ROOT, settings, standards  # noqa: E402

OUT = ROOT.parent / "policies" / "PayNest_Contracting_Standards.md"
SILENT = {"risk": "Missing (counts as full risk)", "ok": "Not mentioned (fine)"}


def _clean(text: str) -> str:
    """Collapse YAML line breaks into one line."""
    return " ".join(str(text).split())


def summary() -> list[str]:
    """The overview table of all standards."""
    rows = ["| Ref. | Provision | Weight | Key rule | If the contract is silent |", "|---|---|:-:|:-:|---|"]
    for r in standards():
        rows.append(f"| {r['id']} | {r['title']} | {r['weight']} | {'Yes' if r['critical'] else ''} | {SILENT[r['if_silent']]} |")
    return rows


def section(r: dict) -> list[str]:
    """The full policy text for one standard."""
    key = " · Key rule" if r["critical"] else ""
    return [
        f"## {r['id']} · {r['title']}",
        f"*{r['category']} · Weight {r['weight']}{key} · If silent: {SILENT[r['if_silent']]}*",
        "",
        f"**Why it matters.** {_clean(r['rationale'])}",
        "",
        "| Position | What PayNest accepts | Who can approve |",
        "|---|---|---|",
        f"| ✅ Ideal | {_clean(r['preferred'])} | Standard terms |",
        f"| 🟠 Can accept | {_clean(r['fallback'])} | {r['approval']['fallback']} |",
        f"| ⛔ Never accept | {_clean(r['walk_away'])} | {r['approval']['walk_away']} |",
        "",
        f"**PayNest's standard clause.** {_clean(r['standard_clause'])}",
        "",
        f"**What to ask the client for.** {_clean(r['proposed_amendment'])}",
        "",
        f"**Does not apply when.** {_clean(r['na_when'])}",
        "",
    ]


def build() -> str:
    """The whole policy document as Markdown."""
    version = settings()["app"]["standards_version"]
    lines = [
        f"# PayNest Contracting Standards {version}",
        "",
        "**Company policy · Client agreements (PayNest is the Service Provider) · Owner: General Counsel**",
        "",
        "Every contract a client asks PayNest to sign is checked against these 10 standards. For each one",
        "the policy states what PayNest wants (Ideal), what it can live with after negotiation (Can accept),",
        "what it never signs without senior approval (Never accept), and who may approve a deviation.",
        "",
        "> Generated from `copilot/config/standards/*.yaml`, the same rules the Contract Copilot enforces.",
        "> Do not edit by hand: change the YAML and run `scripts/build_policy_doc.py`. PayNest is fictional.",
        "",
        *summary(),
        "",
    ]
    for r in standards():
        lines += section(r)
    return "\n".join(lines)


if __name__ == "__main__":
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(build(), encoding="utf-8")
    print(f"✓ {OUT.relative_to(ROOT.parent)}")
