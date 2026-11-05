# Handoff: PayNest Contract Copilot

State as of 2026-11-05. Read `CLAUDE.md` first: its golden rules apply. This file covers the branch work and what is still open.

## Git state: everything is pushed

Local and GitHub match for every branch below (checked after the last push). Remote: `AnjaniMalhotra/legal-docs-review`.

| Branch | Tip | What it is |
|---|---|---|
| `full-docker` and `main` | `5dd2920` + the commit that adds this file | The finished project in Docker. **Ground truth.** `main` was fast-forwarded to it and is kept identical |
| `step-4-evals` | `03cf367` | Tag `v4-evals`. Same code as `full-docker`, but native (no Docker packaging) |
| `step-3-review-agent` | `310bb62` | Tag `v3-review-agent` |
| `step-2-rag` | `eacfa06` | Tag `v2-rag` |
| `step-1-setup` | `f66df37` | Tag `v1-setup` |
| `gh-pages` | `5640f6b` | The published deck (https://anjanimalhotra.github.io/legal-docs-review/), a copy of `presentation/` |

The four tags were force-pushed to the new tips. This `summary.md` was committed and pushed on the user's request.

## How the branches relate (read before changing anything)

The project is taught step by step, so the branches are cumulative. The rule is:

- **Change `full-docker` first.** It is tested and is the reference for every other branch.
- **`step-4-evals`** = `full-docker` minus Docker packaging (`docker-compose*.yml`, `Dockerfile`, `start.sh`, `.dockerignore`, `summary.md`). It keeps `SETUP.md`, a native `Makefile`, `run.sh` and `pull_models.sh`.
- **Steps 1 to 3** = `step-4-evals` with the content of later steps cut out. Code, tests, prompts, web and standards are copied unchanged. Only these differ per step:
  - `settings.yaml` and `gateway.yaml`: step 1 has `analyst` and `embed`; step 2 adds `retrieval` and `summary`; step 3 adds `classifier`, `scoring` and `gate`; step 4 adds `judge` and `evals`.
  - Bifrost allowlist (`infra/bifrost/config.json`): `llama3.1:8b` appears only from step 4.
  - `requirements.txt`, `Makefile` targets, `app/main.py` (step 2 has no web UI or review routes), `copilot/README.md`.
  - Notebooks: step N has notebooks `01` to `0N`, with `notebooks/requirements.txt` and `notebooks/data/` trimmed to match.
- **Check:** `git diff step-1-setup step-2-rag` (and 2 to 3, 3 to 4) should show only what that step adds. This was true at the last push.
- The branches are not a straight git history. Each was updated separately, so `git log` does not show step 2 on top of step 1. The file contents are consistent.
- The helper scripts used to rebuild the steps were in a temporary folder and are gone. To redo it, copy files from `step-4-evals` with `git checkout step-4-evals -- <paths>` and cut the later content, as listed above.

## What changed in this session

- **Steps 1 to 4 brought up to `full-docker`:** the teaching cleanup, chat synonyms, standalone notebooks at the repo root, Bifrost dashboard login, and no retention job. `GET /reviews/{id}` stays removed because `full-docker` dropped it.
- **Step 1 now has the `embed` role**, because notebook `01` uses embeddings. `STEPS.md` says so.
- **Bug fixed in `create_secrets.sh` (on `full-docker` too):** it never wrote `BIFROST_ADMIN_PASSWORD`, which `infra/bifrost/config.json` reads.
- **`credentials.md`** (in every branch except `gh-pages`) lists the Langfuse and Bifrost logins. The script sets both passwords to `12345678`, simple on purpose (local teaching setup). It is 8 characters because Langfuse may reject shorter ones. **Not verified**, as nothing was running.
- **This machine keeps its old random passwords.** `create_secrets.sh` never overwrites files, and the `.env` files were not read or changed. `credentials.md` applies to fresh setups only.
- **Docs:** `STEPS.md` names `full-docker` as the finished project and has a learning-path diagram. `README.md` has a how-it-fits-together diagram. `infra/README.md` has a Mermaid picture. `docs/3_architecture.md` has a five-box review diagram and an "In simple words" box, and `docs/4_tech_stack.md` has a similar box. The GPU/CPU contradiction in the tech-stack doc is fixed, and old accuracy numbers in `CLAUDE.md` and `copilot/README.md` now say 3 of 5.
- **Deck:** `gh-pages` carries the current deck (hardware, models and speed slides, title fix). The user chose to **leave its results slide at 5 of 5 bands**.

## Not verified

No Ollama was running during this work, so nothing was run. Python, YAML, JSON and notebook files were only parse-checked. The Mermaid diagrams were only bracket-checked, not rendered. Tests were not run on any step branch. Please run `make test` on a branch before relying on it.

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

| App | URL |
|---|---|
| Copilot | http://localhost:8000 (no login) |
| Bifrost | http://localhost:8080 |
| Langfuse | http://localhost:3000 |
| Website, deck | http://localhost:5500, http://localhost:5600 (no login) |

Logins for a fresh setup are in `credentials.md`. This machine's own logins are in the git-ignored `.env` files; rule 9 applies, so do not read or print them unless the user asks.

Tests: `cd copilot && .venv/Scripts/python.exe -m pytest -q` (64 passed on the last run, before this session). The venv is Python 3.13 and git-ignored.

## User decisions already made

- `copilot/sample_contracts/` stays **and** the notebooks keep their own copies.
- Notebooks keep their outputs. Evals may be run when asked.
- Do not commit or push unless told to.
- Only the Docker Ollama was deleted. Leave the unrelated `retail_vault_creds` Docker volume alone.
- Docker comes only in the last branch. Steps 1 to 4 stay native, with Bifrost and Langfuse in Docker.
- Notebook `01` is in step 1, and the others arrive with their own step.
- The deck's results slide stays as it is.

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

**Still out of date:** the deck's results slide (`presentation/js/data.js`) shows the older Mac run: 5 of 5 bands, CareWell 54. Do not repeat that as current. `CLAUDE.md` and `copilot/README.md` were corrected.

## Tried and rejected

Prompt lines saying the standard is not contract text, plus a classifier retry when the quote matches the standard but not the retrieved clauses. Result: still 38 of 50 and 3 of 5. Lexmore was fixed, but BrightRetail fell to Medium and Orbit got further off. A small prompt edit also shifted unrelated rules, so more prompt tuning on these 5 contracts is not worthwhile. Fully reverted. The patch is gone; it is simple to recreate.

## Open items, awaiting the user

1. **Risk floor gap:** a key rule (P1-P3) at `Needs review` does not trigger the "at least High" floor. One-line change to `scoring.floor.statuses`; run `tests/test_scoring.py`. Recommended, though false alarms on key rules would also show High.
2. **Silent contracts:** many false alarms come from the model "finding" evidence for topics the contract does not cover. A Python pre-check on retrieved clauses is likely better than prompts.
3. Known misses still open: CareWell P8 (45 days should be Partial, model says Conflicting), CareWell P7.
4. Unexplained: Langfuse worker socket timeouts, seen earlier, had stopped when last checked. `Failed to export spans` appeared from short-lived script runs; traces from the app do arrive.
5. Remaining redundant code, reported but not changed: JSON parsing in `classifier.py` and `summariser.py`; approver rule in `findings.js` and `report.py`; hardcoded footer regex in `document_view.js`; `clause_no`, `paynest_position`, `disclaimer`, `uploaded_at` never shown in the UI.
6. `policy_service.py` says a reviewer can reload and resume, but no branch has a `GET /reviews/{id}` route or a UI for it. The wording in the docstring is still wrong.
7. Test leftovers in `copilot/data/`, including one Lexmore review still awaiting a decision.
8. From `CLAUDE.md`, still not done: no-egress check, held-out contract run (PDFs `06`-`15`, do not tune on them).
9. The Langfuse login `12345678` (8 characters) is untested; if Langfuse rejects it, change `PW=` in `create_secrets.sh` on every branch.

## Pitfalls

- `04_evals` needs the venv kernel, because the default `python3` kernel may resolve to the global Python, which lacks `ragas`. Set `JUPYTER_PATH` to `copilot/.venv/share/jupyter` and use `--ExecutePreprocessor.kernel_name=paynest-venv`. Reset the notebook's kernelspec to `python3` afterwards.
- This Langfuse version only serves `/api/public/v2/observations`; the older traces API returns 404.
- The app image contains the code, so run `docker compose -f docker-compose.yml up -d --build --no-deps app` after code changes. `config/` is mounted live, but `lru_cache` needs an app restart.
- The GPU fits one large model at a time. Stop the app's use of it before long eval runs.
- When changing a model, update `settings.yaml`, `gateway.yaml` and both Bifrost configs (`config.json` and `config.native.json`) on `full-docker`; on the native branches, only `config.json`, and keep its allowlist to that step's models.
- In Python heredocs here, avoid literal Windows paths: backslash escapes broke twice. Build them with `chr(92)`.
