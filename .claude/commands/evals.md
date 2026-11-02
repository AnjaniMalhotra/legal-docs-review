---
description: Run the golden-set evals and summarise against targets
---

Run and report the copilot evaluation suite.

1. Check that `copilot/sample_contracts/*.pdf` exist and Ollama is running (`ollama list`). If not, ask before starting it.
2. Run `make evals` from `copilot/` in the background (about 10-20 min per contract on 8 GB).
   One contract: `make evals ARGS="--contract lexmore"`. No judge model: `ARGS="--skip-ragas"`.
3. Report each contract's line as it prints (score vs expected, rules right), then the summary.
4. Report the target table exactly as printed: metric, target, actual, met.
5. Call out `compliant_on_risky`: it must be 0. Any other value is a release blocker.
6. For any missed target, give the number and a likely reason. Never hide or drop a metric.
