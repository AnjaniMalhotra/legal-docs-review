# 4 · Tech Stack and Code Walkthrough

> **In simple words.** Each row in the first table is one tool: what it does here, and why we picked it. The rest of the
> page shows where each idea lives in the code, so you can open the file and read it. Every file is short.
> Stuck on a word? See the [glossary](glossary.md).

What each tool does, why it was chosen, and where to find it in the code. Every code file is under 120 lines.

## 1. The stack

| Layer | Tool | What it does here | Why this one |
|---|---|---|---|
| UI | Plain **HTML · CSS · JS** (`copilot/web/`) | Upload, summary, highlighted agreement, review cards, Issues List, chat | No framework and no CDN: nothing to download, easy to read |
| API | **FastAPI** (`app/api/`, `app/main.py`) | HTTP routes for upload, chat and reviews; serves the UI | Small, typed, auto-generated docs at `/api/docs` |
| Workflow | **LangGraph** (`app/graph/`) | Runs classify → score → pause for a lawyer → finalize | Built-in pause and resume (`interrupt`) with saved state |
| Vectors | **Chroma** (`app/ingest/vector_store.py`) | Stores clause chunks and their embeddings on disk | Runs inside the app; no server to manage |
| Models | **Ollama** | Serves the three local models | One command to pull and run models. In Docker on a Mac it uses the CPU; the native option in `infra/README.md` uses the GPU |
| Analyst model | **Qwen 2.5 7B Instruct** | Summary, chat answers, standards classification (strict JSON) | Follows a schema well and fits in 8 GB of RAM |
| Judge model | **Llama 3.1 8B** | Grades chat answers in evals (Ragas) | A different model family, so it doesn't grade its own work |
| Embeddings | **nomic-embed-text** | Turns clauses and questions into vectors | Small, local, good retrieval |
| Gateway | **Bifrost** (`infra/bifrost/`) | One door for every model call; only allowed models pass | The app never names a model; a refused model never runs |
| Tracing and prompts | **Langfuse**, self-hosted (`infra/langfuse/`) | Shows every step, prompt and answer; keeps prompt versions; tags traces with `guardrail:*` | Traces contain contract text, so they must stay local |
| Evals | **Ragas** + plain Python (`copilot/evals/`) | Accuracy against an answer key; faithfulness of chat answers | Proves quality with numbers, not impressions |

## 2. How it runs

```bash
cd copilot
../start.sh   # secrets, every service and the 3 models → http://localhost:8000
make up       # after a code change: rebuild and restart
make down     # stop every service
make test     # unit tests, no models needed
make evals     # run the sample contracts against the answer key
```

Everything runs in Docker from `docker-compose.yml`. Docker on a Mac cannot use the GPU, so models run on the CPU there.

## 3. Where everything lives

```
copilot/
  app/core/      config · gateway (only door to models) · tracing · errors · doc store
  app/ingest/    PDF → pages → clause chunks → Chroma
  app/rag/       retrieval · cited chat answers · key-terms summary
  app/policy/    classifier · grounding guard · stricter-only checks · scoring · review · report
  app/graph/     LangGraph: classify → score → human_gate → finalize
  app/api/       HTTP routes
  config/        settings.yaml (every number, role → model) · profiles/gateway.yaml · standards/P01–P10
  prompts/       starting copy of the instructions given to the model (scripts/push_prompts.py loads them into Langfuse)
  web/           the browser UI
  evals/         answer key (golden_set.json) · runner · metrics + Ragas
  tests/         unit tests · test_red_team.py: five attacks on the real models
  sample_contracts/  synthetic contract PDFs
  Dockerfile     builds the app image · .dockerignore keeps secrets and contracts out
notebooks/       standalone demos of the logic, with their own demo data and saved outputs
policies/        PayNest Contracting Standards (generated from config/standards)
docker-compose.yml  starts every service
start.sh         sets up and starts everything
infra/           Bifrost and Langfuse config
```

## 4. Walkthrough: uploading a contract

| Step | File | What to look at |
|---|---|---|
| Browser sends the PDF | `web/js/intake.js` → `web/js/api.js` | `uploadPdf()` |
| Route checks size and type | `app/api/routes_documents.py` | `upload()` |
| PDF → text per page | `app/ingest/ingest_service.py` | `extract_pages()` |
| Text → clause chunks | `app/ingest/chunker.py` | `_heading()` decides title vs sub-clause |
| Chunks → vectors | `app/ingest/vector_store.py` | heading + text embedded together |

## 5. Walkthrough: summary and chat

| Step | File | What to look at |
|---|---|---|
| Key-terms summary | `app/rag/summariser.py` + `prompts/summarise_agreement.md` | one model call; Python attaches the sources |
| Find relevant clauses | `app/rag/retriever.py` | by meaning, then re-ranked by the question's words |
| Build the prompt | `app/core/config.py` (`render()`) + `prompts/chat_answer.md` | prompts are files, not code |
| Call the model | `app/core/gateway.py` | role → model; errors raised loudly |
| Honest "Not found" | `app/rag/answerer.py` | no clauses → no model call |
| Prompt leak check | `app/rag/output_guard.py` | a reply copying 8 words in a row from the prompt becomes a refusal, tagged `guardrail:prompt_leak` |

## 6. Walkthrough: the standards review

| Step | File | What to look at |
|---|---|---|
| The rules | `config/standards/*.yaml` | positions, weight, if-silent, red flags, numeric bands |
| Find the clauses | `app/rag/retriever.py` | `for_rule()`: re-ranked by each rule's `look_for` terms |
| Classify one rule | `app/policy/classifier.py` + `prompts/classify_rule.md` | strict JSON; a rejected reply is retried with the reason |
| Quote must be real | `app/policy/grounding.py` | `apply_guard()`, even across page breaks |
| Stricter-only checks | `app/policy/checks.py` | `red_flag()` phrases · `numbers()` days, hours, % |
| The score | `app/policy/scoring.py` | `compute()`: weights × gaps, bands, floor |
| Pause for a lawyer | `app/graph/nodes.py` | `human_gate()` calls `interrupt()` |
| Decisions and report | `app/policy/review.py`, `app/policy/report.py` | audit trail, Issues List |

## 7. Exercises

1. **Change a weight.** Set P4's weight to 3 in its YAML, run `make test`, and explain which expected scores change.
2. **Break the guard.** In `tests/test_safety_controls.py`, change one word of a quote. What status does it get, and why is that safe?
3. **Swap a model.** Change `models.analyst.model` in `settings.yaml` and re-run one contract with `make evals ARGS="--contract lexmore"`. Which file did you *not* have to touch?
4. **Add a rule (P11).** "Non-solicitation of PayNest staff": add the YAML and answer-key labels. What breaks first?
5. **Trace a request.** Turn on the gateway, run a review and find it in Langfuse. Which step took longest?
6. **Pause and resume.** Put a breakpoint in `nodes.human_gate`, run a review, then resume it at `/api/docs`.
