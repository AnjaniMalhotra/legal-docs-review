"""Runs the golden-set evals one contract at a time and checks the targets in settings.yaml.

Usage:  make evals                                   (all five contracts)
        make evals ARGS="--contract lexmore"         (one contract)
        make evals ARGS="--skip-ragas"               (no judge model)
Uses the SAME pipeline as the UI: ingest -> policy graph -> chat. Results are printed per
contract as soon as each finishes, then summed up. Ragas scores are also pushed to Langfuse.
"""
import argparse
import json
import subprocess
import time

from app.core import tracing
from app.core.config import ROOT, data_dir, settings
from app.graph import policy_service
from app.ingest.ingest_service import ingest_pdf
from app.rag.answerer import answer
from evals import metrics

REVIEWER = "evals-bot"


def _unload(role: str) -> None:
    """Free the model's memory before the next role loads (an 8 GB laptop fits one at a time)."""
    model = settings()["models"][role]["model"].removeprefix("ollama/")
    subprocess.run(["ollama", "stop", model], capture_output=True)


def _review(c: dict, doc_id: str) -> dict:
    """Run the review and pair each verdict with its expected label."""
    review = policy_service.start(doc_id, REVIEWER)
    done = review["state"] != "awaiting_review"
    findings = review["report"]["findings"] if done else review["findings"]
    result = review["report"]["system_result"] if done else review["system_result"]
    rules = [{"rule": f["rule_id"], "expected": c["labels"][f["rule_id"]], "got": f["status"],
              "grounded": f.get("grounded"), "reason": f.get("reason", "")} for f in findings]
    return {"score": result["score"], "band": result["band"], "rules": rules}


def _chat(questions: list[dict], doc_id: str) -> list[dict]:
    """Ask the contract's golden questions and check the cited pages."""
    chats = []
    for q in questions:
        res = answer(doc_id, q["question"])
        chats.append({**q, "answer": res["answer"], "found": res["found"], "contexts": res["contexts"],
                      "trace_id": res["trace_id"], "cited_ok": metrics.citation_hit(res["answer"], q["expected_pages"])})
    return chats


def _ragas(chats: list[dict]) -> list[float]:
    """Judge the answerable chats; scores go to their Langfuse traces. Returns faithfulness values."""
    answerable = [c for c in chats if c["answerable"]]
    scores = metrics.score_answers([{"question": c["question"], "answer": c["answer"], "contexts": c["contexts"],
                                     "reference": c["expected_answer"]} for c in answerable]) if answerable else []
    for chat, s in zip(answerable, scores):
        chat["ragas"] = s
        for name, value in s.items():
            if value is not None:
                tracing.score(chat["trace_id"], name, value)
    return [s["faithfulness"] for s in scores if s.get("faithfulness") is not None]


def evaluate(c: dict, questions: list[dict], skip_ragas: bool) -> dict:
    """Review, chat and (optionally) Ragas for one contract, with timings."""
    t0 = time.time()
    doc_id = ingest_pdf((ROOT / c["file"]).name, (ROOT / c["file"]).read_bytes())["doc_id"]
    out = {"id": c["id"], "expected": f"{c['expected_score']} {c['expected_band']}", **_review(c, doc_id)}
    t1 = time.time()
    out["chats"] = _chat([q for q in questions if q["contract"] == c["id"]], doc_id)
    t2 = time.time()
    _unload("analyst")
    out["faithfulness"] = [] if skip_ragas else _ragas(out["chats"])
    _unload("judge")
    for chat in out["chats"]:
        chat.pop("contexts")
    out["exact"] = sum(r["expected"] == r["got"] for r in out["rules"])
    out["seconds"] = {"review": round(t1 - t0), "chat": round(t2 - t1), "ragas": round(time.time() - t2)}
    return out


def main() -> None:
    """Run each contract, print its result, then check the targets."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--contract", help="id of one golden contract, e.g. lexmore")
    parser.add_argument("--skip-ragas", action="store_true")
    args = parser.parse_args()
    golden = json.loads((ROOT / "evals" / "golden_set.json").read_text(encoding="utf-8"))
    contracts = [c for c in golden["contracts"] if args.contract in (None, c["id"])]
    runs = []
    for c in contracts:
        runs.append(evaluate(c, golden["questions"], args.skip_ragas))
        r = runs[-1]
        print(f"{r['id']:<13} {r['score']} {r['band']:<8} (expected {r['expected']})  "
              f"rules {r['exact']}/{len(r['rules'])}  seconds {r['seconds']}", flush=True)
    tracing.flush()
    result = {**metrics.summarise(runs), "contracts": runs}
    out = data_dir("evals") / "latest.json"
    out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    for row in result["targets"]:
        print(f"{ {True: '✅', False: '❌', None: '–'}[row['met']]} {row['metric']:<26} "
              f"target {row['target']:<6} actual {row['actual']}")
    print(f"{'✅' if result['compliant_on_risky'] == 0 else '❌'} compliant_on_risky = {result['compliant_on_risky']}")
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
