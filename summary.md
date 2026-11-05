# Handoff: PayNest Contract Copilot

State as of 2026-11-05. Read `CLAUDE.md` first: its golden rules apply. This file adds only what happened in the last session.

## Git state

- Commit `a61d543` is pushed: local `full-docker` and `origin/full-docker` match.
- `main` (`69713ef`) and `gh-pages` were not changed, so the published deck does not have the title fix and `main` has none of this work.
- This file (`summary.md`) is deliberately uncommitted. Ask before committing it.

## How it runs on this machine

Windows 10, Ryzen 7 2700, 16 GB RAM, GTX 1660 6 GB, Docker Desktop limited to 7.7 GB, no `make` and no `gh`. Use Git Bash.

- **Native:** Ollama (GPU) with `qwen2.5:7b-instruct`, `llama3.1:8b`, `nomic-embed-text`.
- **Docker:** app, Bifrost, Langfuse (web, worker, Postgres, ClickHouse, Redis, MinIO), website, presentation.
- The app reaches models through Bifrost at `host.docker.internal:11434`, using `infra/bifrost/config.native.json`.

**Everything is currently stopped**, including Ollama. To start, open the Ollama app, then from the repo root:

```bash
docker compose -f docker-compose.yml -f docker-compose.native.yml up -d
docker compose -f docker-compose.yml up -d --no-deps app
```

Never use `./start.sh` or plain `docker compose up` here: they recreate the Docker Ollama, which was deleted on purpose (CPU only, and it exhausted memory).

| App | URL | Login |
|---|---|---|
| Copilot | http://localhost:8000 | None |
| Bifrost | http://localhost:8080 | `admin`; password is `BIFROST_ADMIN_PASSWORD` in `infra/bifrost/.env` |
| Langfuse | http://localhost:3000 | `LANGFUSE_INIT_USER_*` in `infra/langfuse/.env` |
| Website, deck | http://localhost:5500, http://localhost:5600 | None |

The user gave explicit permission to show them these logins. Otherwise rule 9 applies: do not read or print `.env` files or `copilot/data/`.

Tests: `cd copilot && .venv/Scripts/python.exe -m pytest -q` (64 pass). The venv is Python 3.13 and git-ignored.

## What commit a61d543 contains

- **CRLF crash:** `.gitattributes` forces LF on `*.sh`.
- **Native mode:** `docker-compose.native.yml`, `infra/bifrost/config.native.json`. Change both Bifrost configs when swapping a model.
- **Notebooks:** moved to root `notebooks/`, standalone (no `app` imports), demo data in `notebooks/data/`, outputs saved. The Windows username was removed from saved outputs in `04_evals`.
- **Chat fix:** `retrieval.question_synonyms` in `settings.yaml`, used by `retriever.for_question`. "Breach" now finds "Security Incident" clauses. Tested live on CareWell and Lexmore.
- **Bifrost dashboard on:** config store plus `enforce_auth_on_inference: false`. Without that setting every model call returns 401. Admin password comes from env; `create_secrets.sh` now generates it.
- **Deck title** no longer overlaps the graphic. Small dead code removed, docs updated.

## User decisions already made

- `copilot/sample_contracts/` stays **and** the notebooks keep their own copies.
- Notebooks keep their outputs. Evals may be run when asked.
- Do not commit or push unless told to.
- Only the Docker Ollama was deleted. Leave the unrelated `retail_vault_creds` Docker volume alone.

## Measured results (this machine, GPU)

Analyst 22 tokens/s, judge 18 tokens/s, model load 18 s (Docker CPU was 6 tokens/s, 33 s). Chat 7-11 s, up to about 60 s right after a model swap. Full review 133-190 s. Bifrost adds no measurable delay.

Evals on the 5 answer-key contracts, `--skip-ragas`:

| Metric | Result |
|---|---|
| Standards correct | 76% (38 of 50), target 80% |
| Risk bands correct | **3 of 5** |
| Citation accuracy | 86%, target 90% |
| Quotes verified | 87%, target 100% |
| Honest "Not found" | 100% |
| Risky clauses marked OK | 0 (release blocker holds) |

| Contract | Score (expected) |
|---|---|
| CareWell | 57 High (49 High) |
| Northstar | 43 Medium (43 Medium) |
| Lexmore | 23 Medium (3 Low): wrong band |
| BrightRetail | 34 High (29 High) |
| Orbit | 40 Medium (18 Low): wrong band |

**Out of date:** `CLAUDE.md` status and the deck (`presentation/js/data.js`, results slide) still show the Mac run: 5 of 5 bands, CareWell 54. Do not repeat those as current.

## Tried and rejected

Prompt lines saying the standard is not contract text, plus a classifier retry when the quote matches the standard but not the retrieved clauses. Result: still 38 of 50 and 3 of 5. Lexmore was fixed, but BrightRetail fell to Medium and Orbit got further off. A small prompt edit also shifted unrelated rules, so more prompt tuning on these 5 contracts is not worthwhile. Fully reverted. The patch was in the old scratchpad and may be gone; it is simple to recreate.

## Open items, awaiting the user

1. **Risk floor gap:** a key rule (P1-P3) at `Needs review` does not trigger the "at least High" floor. One-line change to `scoring.floor.statuses`; run `tests/test_scoring.py`. Recommended, though false alarms on key rules would also show High.
2. **Silent contracts:** many false alarms come from the model "finding" evidence for topics the contract does not cover. A Python pre-check on retrieved clauses is likely better than prompts.
3. **Update the deck and `CLAUDE.md`** with the numbers above.
4. Known misses still open: CareWell P8 (45 days should be Partial, model says Conflicting), CareWell P7.
5. Unexplained: Langfuse worker socket timeouts, seen earlier, had stopped when last checked. `Failed to export spans` appeared from short-lived script runs; traces from the app do arrive.
6. Remaining redundant code, reported but not changed: JSON parsing in `classifier.py` and `summariser.py`; approver rule in `findings.js` and `report.py`; hardcoded footer regex in `document_view.js`; `clause_no`, `paynest_position`, `disclaimer`, `uploaded_at` never shown in the UI.
7. `policy_service.py` says a reviewer can reload and resume, but `full-docker` and `main` have no `GET /reviews/{id}` route and no UI for it.
8. Test leftovers in `copilot/data/`, including one Lexmore review still awaiting a decision.
9. From `CLAUDE.md`, still not done: no-egress check, held-out contract run (PDFs `06`-`15`, do not tune on them).

## Pitfalls

- `04_evals` needs the venv kernel, because the default `python3` kernel may resolve to the global Python, which lacks `ragas`. Set `JUPYTER_PATH` to `copilot/.venv/share/jupyter` and use `--ExecutePreprocessor.kernel_name=paynest-venv`. Reset the notebook's kernelspec to `python3` afterwards.
- This Langfuse version only serves `/api/public/v2/observations`; the older traces API returns 404.
- The app image contains the code, so run `docker compose -f docker-compose.yml up -d --build --no-deps app` after code changes. `config/` is mounted live, but `lru_cache` needs an app restart.
- The GPU fits one large model at a time. Stop the app's use of it before long eval runs.
- In Python heredocs here, avoid literal Windows paths: backslash escapes broke twice. Build them with `chr(92)`.
