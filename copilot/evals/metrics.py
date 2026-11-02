"""Eval metrics: plain-Python (accuracy, confusion matrix, citations) and Ragas for chat answers.

Ragas is judged by the local judge role via Bifrost; its telemetry is disabled so nothing leaves the machine.
"""
import os
import re
from collections import Counter
from statistics import mean

os.environ.setdefault("RAGAS_DO_NOT_TRACK", "true")

from app.core.config import env, settings  # noqa: E402

RISKY_TRUE = ("Missing", "Conflicting")


def accuracy(pairs: list[tuple[str, str]]) -> float:
    """pairs: (true_status, predicted_status)."""
    return sum(t == p for t, p in pairs) / len(pairs) if pairs else 0.0


def confusion(pairs: list[tuple[str, str]]) -> dict[str, dict[str, int]]:
    matrix: dict[str, Counter] = {}
    for true, pred in pairs:
        matrix.setdefault(true, Counter())[pred] += 1
    return {t: dict(c) for t, c in matrix.items()}


def compliant_on_risky(pairs: list[tuple[str, str]]) -> int:
    """The release-blocking error: 'Compliant' predicted for a truly Missing/Conflicting rule."""
    return sum(1 for t, p in pairs if t in RISKY_TRUE and p == "Compliant")


def cited_pages(answer: str) -> set[int]:
    """Pages cited in an answer, e.g. '[p.9, 14.1 ...]' or 'page 9'."""
    return {int(n) for n in re.findall(r"(?:\[p\.|page\s+)(\d+)", answer, re.I)}


def citation_hit(answer: str, expected_pages: list[int] | None) -> bool | None:
    """True if any expected page is cited. None when the expected page is not labelled yet."""
    if not expected_pages:
        return None
    return bool(cited_pages(answer) & set(expected_pages))


def ratio(values: list[bool | None]) -> float | None:
    known = [v for v in values if v is not None]
    return sum(known) / len(known) if known else None


def check_targets(actual: dict, targets: dict) -> list[dict]:
    """Rows of target / actual / met for the summary table."""
    rows = []
    for name, target in targets.items():
        value = actual.get(name)
        met = None if value is None else value >= target
        rows.append({"metric": name, "target": target, "actual": value, "met": met})
    return rows


# ---- Ragas (chat answer quality) ------------------------------------------

def _judge():
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
    from ragas.embeddings import LangchainEmbeddingsWrapper
    from ragas.llms import LangchainLLMWrapper

    judge, embed = settings()["models"]["judge"], settings()["models"]["embed"]
    llm = ChatOpenAI(model=judge["model"], base_url=env("BIFROST_URL"), api_key=env("GATEWAY_API_KEY", "local"),
                     temperature=judge["temperature"], timeout=judge["timeout_s"])
    emb = OpenAIEmbeddings(model=embed["model"], base_url=env(embed["base_url_env"]) or env("BIFROST_URL"),
                           api_key=env("GATEWAY_API_KEY", "local"), check_embedding_ctx_length=False)
    return LangchainLLMWrapper(llm), LangchainEmbeddingsWrapper(emb)


def score_answers(samples: list[dict]) -> list[dict]:
    """samples: [{question, answer, contexts, reference}] -> per-sample metric dicts."""
    from ragas import EvaluationDataset, RunConfig, evaluate
    from ragas.metrics import Faithfulness, LLMContextPrecisionWithReference, LLMContextRecall, ResponseRelevancy

    if not samples:
        return []
    dataset = EvaluationDataset.from_list([
        {"user_input": s["question"], "response": s["answer"],
         "retrieved_contexts": s["contexts"], "reference": s["reference"]}
        for s in samples
    ])
    llm, emb = _judge()
    metrics = [Faithfulness(), ResponseRelevancy(), LLMContextPrecisionWithReference(), LLMContextRecall()]
    cfg = settings()["evals"]["ragas"]
    run = RunConfig(max_workers=cfg["max_workers"], timeout=cfg["timeout_s"])
    frame = evaluate(dataset, metrics=metrics, llm=llm, embeddings=emb, run_config=run).to_pandas()
    names = ["faithfulness", "answer_relevancy", "llm_context_precision_with_reference", "context_recall"]
    return [{n: (None if row.get(n) != row.get(n) else float(row.get(n))) for n in names if n in row}
            for row in frame.to_dict("records")]


def summarise(runs: list[dict]) -> dict:
    """All contracts' rules and chats -> the eval targets, confusion matrix and release blocker."""
    pairs = [(r["expected"], r["got"]) for run in runs for r in run["rules"]]
    chats = [c for run in runs for c in run["chats"]]
    faith = [f for run in runs for f in run["faithfulness"]]
    actual = {
        "classification_accuracy": accuracy(pairs),
        "citation_accuracy": ratio([c["cited_ok"] for c in chats if c["answerable"]]),
        "not_found_honesty": ratio([not c["found"] for c in chats if not c["answerable"]]),
        "grounding_pass_rate": ratio([r["grounded"] for run in runs for r in run["rules"]]),
        "faithfulness": mean(faith) if faith else None,
    }
    return {"targets": check_targets(actual, settings()["evals"]["targets"]),
            "confusion": confusion(pairs),
            "compliant_on_risky": compliant_on_risky(pairs)}  # must be 0 (release blocker)
