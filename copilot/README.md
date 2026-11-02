# PayNest Contract Copilot

Fully local, air-gapped AI copilot for reviewing **client contracts** against PayNest's
Contracting Standards. Upload a PDF, read a plain-English summary, ask questions in the chat,
run a one-click review against the 10 standards, see issues highlighted in the contract, let a
lawyer sign off the risky findings, and issue the Issues List for negotiation.
**No byte leaves the machine.**

**Setting it up on a new machine?** Follow [../SETUP.md](../SETUP.md): every command, from installing tools to tracing a review.

**Learning it step by step?** See [../STEPS.md](../STEPS.md): four branches, each with a notebook in `notebooks/` (`make notebook`).

**New to the code?** Read [../docs/4_tech_stack.md](../docs/4_tech_stack.md) (tools and every file) and [../docs/3_architecture.md](../docs/3_architecture.md) (how it works). The rules it checks: [../policies/PayNest_Contracting_Standards.md](../policies/PayNest_Contracting_Standards.md).

## Stack

| Layer | Tool |
|---|---|
| UI | Plain HTML / CSS / JS (`web/`), served by FastAPI |
| API | FastAPI (`app/api/`) |
| Workflow | LangGraph review graph with a SQLite checkpointer (human gate) |
| Retrieval | Chroma (in-process), clause-level chunks with page numbers, hybrid re-ranking |
| Models | Ollama, native on the Mac (uses the GPU): `analyst` Qwen 2.5 7B · `judge` Llama 3.1 8B · `embed` nomic-embed-text |
| Gateway (Option B) | Bifrost in Docker: one OpenAI-compatible endpoint, model allowlist |
| Tracing (Option B) | Langfuse, self-hosted in Docker |
| Evals | Plain-Python accuracy + Ragas (`evals/`) |

## First run

Needs Python 3.11+, [Ollama](https://ollama.com) and about 8 GB of RAM free.

```bash
ollama serve &           # if the Ollama app is not already running
make install             # Python environment (.venv)
make setup               # pull the 3 models: the only step that uses the internet
make up                  # → http://localhost:8000
```

## Option B: add the gateway and tracing

Bifrost and Langfuse run in Docker; the app and Ollama stay native. One-time setup: [../infra/README.md](../infra/README.md).

```bash
cp .env.local.example .env.local   # SETTINGS_PROFILE=gateway, Bifrost URL, Langfuse keys
make gateway                       # start Langfuse + Bifrost
make up                            # same app, now through Bifrost and traced in Langfuse
make smoke                         # one prompt per role: check it appears in Langfuse
```

## Everyday commands

```bash
make test                            # 56 unit tests, about 1 second, no models needed
make evals                           # all 5 sample contracts, printed one by one (~1-2 h on 8 GB)
make evals ARGS="--contract lexmore" # one contract
make evals ARGS="--skip-ragas"       # without the judge model
```

## Where things live

```
app/core/     config, gateway (only door to models), tracing, errors, doc store
app/ingest/   PDF → pages → clause chunks → Chroma
app/rag/      retrieval, cited chat answers, key-terms summary
app/policy/   classifier, grounding guard, stricter-only checks, scoring, review, report
app/graph/    LangGraph: classify → score → human_gate → finalize
app/api/      HTTP routes
web/          HTML / CSS / JS UI
config/       settings.yaml (every number + role → model), profiles/gateway.yaml, standards/
prompts/      prompt templates
evals/        golden set, per-contract runner, metrics + Ragas
scripts/      run, model pull, system check, policy document
tests/        unit tests
sample_contracts/  8 synthetic contract PDFs (5 in the answer key, 3 kept unseen)
```

## Known limits (honest list)

- Accuracy on the 5 sample contracts: 76% of rules exact, 5/5 risk bands right, no risky clause
  ever marked OK. These contracts were also used for tuning, so expect lower on new clients.
- A review takes about 5–10 minutes on an 8 GB Mac; close other apps.
- The no-egress check (Wi-Fi off during a review) has not been run yet.
