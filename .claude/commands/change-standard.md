---
description: Safely change a standard, weight or if_silent setting
argument-hint: <rule id and the change, e.g. "P4 weight 4 -> 3">
---

Change requested: $ARGUMENTS

Follow every step. The standards is the compliance brain, so the docs, config and tests must stay in sync.

1. Edit the rule's own file in `copilot/config/standards/` (one file per rule, e.g. `P01_limitation_of_liability.yaml`).
2. Regenerate the company policy: `.venv/bin/python scripts/build_policy_doc.py` (writes `policies/PayNest_Contracting_Standards.md`).
3. If a weight or `if_silent` changed: recompute every `expected_score` / `expected_band` in
   `copilot/evals/golden_set.json` with the formula in `docs/3_architecture.md` (section 8).
4. Run the tests (`/test`). The total-weight test may need updating if the total changed. Say so explicitly.
5. Summarise what changed and the new expected scores.
