---
description: Run the copilot unit tests
---

Run the deterministic test suite for the PayNest Contract Copilot.

1. From `copilot/`, run the pure-logic tests: `make test` (uses `.venv`, no models needed).
2. Report: number passed or failed, and any failing test with its assertion.
3. If a golden-score test fails (expected 49 / 43 / 3 / 29 / 18), do not change the expected numbers.
   Find out whether the standards weights or `settings.yaml` scoring changed, and say which.
