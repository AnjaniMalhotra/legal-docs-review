# CLAUDE.md — PayNest Contract Copilot

Guidance for Claude Code working in this repository.

## What this is

A fully local, air-gapped AI copilot that lets PayNest's legal team review **client contracts**
against PayNest's **Contracting Standards**: chat Q&A and a one-click policy check with a
0–100 risk score, counsel approval and an Issues List for negotiation. PayNest (fictional) is a private payroll
provider whose promise is *"your data never leaves PayNest"*, and this tool keeps the same promise.

| Folder | What | Notes |
|---|---|---|
| `start.sh` | Sets up and starts everything: tools, secrets, services, models | `./start.sh` |
| `STEPS.md` | The 4 learning steps (branches `step-1-setup` … `step-4-evals`) | Standalone demos, one per step, in `notebooks/` (they import nothing from the app) |
| `docs/` | Supporting docs: company and clients, case studies, architecture, tech stack, glossary | Reference only |
| `policies/` | PayNest Contracting Standards (company policy), generated from `copilot/config/standards/` | Do not edit by hand |
| `docker-compose.yml` | Full Docker: starts every service from one file | See `infra/README.md` |
| `docker-compose.native.yml` | Add it when Docker cannot give the models memory or a GPU: Ollama and the app run natively | See `infra/README.md` |
| `infra/` | Bifrost and self-hosted Langfuse config used by `docker-compose.yml` | See `infra/README.md` |
| `website/` | PayNest marketing site (static HTML/CSS/JS) | Separate from the copilot |
| `copilot/` | The product: FastAPI + HTML/CSS UI + LangGraph + Ollama (via Bifrost) | See `copilot/README.md` |

## Golden rules (do not break)

1. **Max 120 lines per file.** Split by responsibility instead. A hook checks this after every edit.
2. **No hardcoded tunables.** Numbers, thresholds, weights, bands, model names, prompts and URLs live in
   `copilot/config/settings.yaml`, `copilot/config/standards/*.yaml`, `copilot/prompts/*.md` or `.env`.
   Only the *status vocabulary* (`LLM_STATUSES`, `ALL_STATUSES` in `app/policy/scoring.py`) is fixed in code.
3. **The app never names a model.** Call `gateway.chat(role, …)` / `gateway.embed(…)` with a role
   (`analyst`, `judge`, `embed`). All model traffic goes through `app/core/gateway.py` → Bifrost.
4. **The LLM reads; Python decides.** The LLM returns one of `Compliant | Partial | Conflicting | Not found | N/A`.
   Python maps `Not found` via `if_silent`, runs the grounding guard and computes the score. Never let an LLM produce a score.
5. **The grounding guard is non-negotiable.** Any quoted finding whose quote isn't verbatim in the PDF becomes `Needs review`.
6. **Perspective rule.** PayNest is the Provider; the client wrote the contract; judge risk *to PayNest*.
7. **Nothing leaves the machine.** No cloud APIs, CDNs, external fonts, analytics or hosted tracing (no LangSmith).
   Telemetry stays off (Chroma, Ragas, HF offline). Langfuse must be self-hosted.
8. **Fail loudly.** The analyst role has no fallback. Raise `GatewayError` rather than silently degrading.
9. **Confidential data.** Never read, print or commit `copilot/data/` (uploaded contracts, vectors, reports) or `.env`.
   Only synthetic contracts belong in `copilot/sample_contracts/` and `notebooks/data/`.

## Commands (run from `copilot/`)

```bash
make up     # start every service in Docker → http://localhost:8000 (first run downloads images)
make setup  # one-time model download into the Ollama container, after make up (egress allowed only for setup)
make down   # stop every service
make logs   # follow the app's log
make policy # rebuild policies/ from config/standards/
make test   # unit tests (no models)
make smoke   # one prompt per role
make evals   # golden-set evals, per contract; ARGS="--contract lexmore" or "--skip-ragas"
```

## Where to change what

| Change | Edit | Then |
|---|---|---|
| A standard, weight or `if_silent` | `config/standards/P*.yaml`, then `make policy` | Recompute `expected_score` in `evals/golden_set.json`; run tests |
| Bands, gap factors, floor, gate | `config/settings.yaml` → `scoring` / `gate` | Run `tests/test_scoring.py` |
| Swap a model | `config/settings.yaml` → `models.<role>.model`, `config/profiles/gateway.yaml` **and** the `models` allowlist in `infra/bifrost/config.json` and `config.native.json` | `make setup` (pull), `make smoke` |
| Prompt wording | `prompts/*.md` (`$placeholders`) | Run evals and compare |
| UI | `web/` (ES modules, no frameworks, no CDN) | Keep each file ≤120 lines |
| A new term | `docs/glossary.md` | Alphabetical |

## Code map (`copilot/app/`)


- `core/` `config` (settings + gateway profile, standards, prompt templates) · `gateway.py` (only door to models, no fallback) · `errors.py` (domain errors → HTTP codes, handled once in `main.py`) · `tracing.py` (Langfuse, no-op without keys) · `doc_store.py`
- `ingest/` `ingest_service` (PDF text → `chunker` (clause headings + page) → `vector_store` (Chroma))
- `rag/` `retriever` (hybrid for standards) · `answerer` (chat) · `summariser` (key-terms summary, one call, cached; sources attached by Python)
- `policy/` `classifier` (strict JSON; retry with reason; unquoted N/A → Not found) · `grounding` (page-break aware) · `checks` (red-flag tripwire + numeric check; stricter only) · `scoring` · `review` (counsel decisions + audit) · `report` (Issues List)
- `graph/` LangGraph `classify → score → human_gate (interrupt) → finalize`, `nodes` (steps + `ReviewState`) · `policy_service` (builds the graph with a SQLite checkpointer; start/resume)
- `api/` `routes_documents` (upload, page text, summary, Q&A) · `routes_policy` · `main.py` mounts `web/`

Web UI (`copilot/web/js/`): single column, one tab bar (Summary · Agreement · Review · Issues List · Audit trail · Standards). `main` (flow) · `intake` (matter details + upload) · `views` (tabs + Standards tab with the standard clause) · `contract_summary` (key-terms summary) · `document_view` (pages + colour highlights) · `findings` (Review tab: filters + issue cards) · `risk_rating` · `review` (counsel decisions) · `issues_list` (Issues List + Audit trail) · `chat` (Contract Q&A).

## Conventions

- Python 3.11, type hints, a module docstring explaining *why* the file exists, small functions.
- Errors: raise a domain error from `app/core/errors.py` (`NotFoundError`, `GatewayError`, `DecisionError`,
  `UnreadablePdfError`); never a bare `KeyError`. Routes stay thin. `main.py` maps errors to HTTP codes.
- Tech stack and file-by-file walkthrough: `docs/4_tech_stack.md`. Update it when adding a file.
- JS: ES modules, `escapeHtml` for every dynamic value, no `innerHTML` with raw user or model text.
- CSS: tokens in `web/css/base.css` (light + dark). Components in `components.css`.
- Tests: deterministic logic (scoring, grounding, chunker, review) must stay covered. Golden scores must stay 49 / 43 / 3 / 29 / 18.

## Status

Built: config, standards, ingest, chat RAG, policy graph + human gate, corporate legal UI, evals, tests (64 passing).
Contracting Standards v1.0: one YAML per provision in `copilot/config/standards/`. The app shows plain-English labels (OK / Acceptable / Not acceptable / Missing / Not mentioned (fine) / Doesn't apply / Needs a lawyer's check) over the fixed internal status codes; the outgoing Issues List keeps formal legal wording.
This branch runs everything in Docker from `docker-compose.yml`. Docker on a Mac has no GPU access, so models run on the CPU there; `main` keeps Option B (app and Ollama native). Where Docker cannot run the models, `docker-compose.native.yml` moves Ollama out of Docker.
Done: 5 synthetic contract PDFs, smoke test, gateway + tracing, 7B/8B models, per-contract evals: 76% rules exact, 5/5 risk bands, 0 risky clauses marked OK.
Next: no-egress check (Wi-Fi off); Bifrost allowlist test; a held-out set of new contracts run once (no tuning on it).
Open: demo machine specs, deadline, judge at review time.
