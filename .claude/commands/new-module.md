---
description: Add a new module to the copilot following project conventions
argument-hint: <what the module does>
---

New module: $ARGUMENTS

1. Pick the right package under `copilot/app/` (core, ingest, rag, policy, graph, api) or `copilot/web/js/`.
   If none fits, propose a new folder first and explain why.
2. Name the file after its single responsibility (e.g. `issues_list_formatter.py`, not `utils.py`).
3. Start with a module docstring (Python) or a top comment (JS) explaining why the file exists.
4. Read every tunable value from `config/settings.yaml`. Add new keys there with a comment. No magic numbers.
5. Any model call goes through `app/core/gateway.py` with a role. Never import `openai` elsewhere.
6. Keep the file within 120 lines. If it grows, split it.
7. Add or extend a test in `copilot/tests/` for any deterministic logic.
8. Update the code map in `CLAUDE.md` if you added a file.
