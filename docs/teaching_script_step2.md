# Teaching script: step 2, documents and RAG

For the teacher. Every command and expected output below comes from a real run on the teaching laptop (Windows, cmd).

**Before class:**
- Ollama is on: `curl http://localhost:11434` says `Ollama is running`.
- Docker is open, but don't start the containers until step 17.
- Open **one** cmd window in your project folder and run:
  ```
  paynestenv\Scripts\activate
  cd copilot
  ```

**The story for the class:** "In step 1 the app could talk to a model. Now it reads a contract and answers with the page it found the answer on. This is called RAG."

---

## Part A: What is new

### Step 1: RAG in one picture (no commands)
**Open:** `docs/6_documents_and_rag.md`, section 2 (the flow).

**Say:** "Retrieval finds the right clauses. Augmented means we paste only those into the prompt. Generation means the model answers from them and cites the page. We never give it the whole contract."

### Step 2: `copilot/README.md`
**Open:** `copilot/README.md`

**Say:** "Step 2 adds reading PDFs, searching them, and answering with citations."

### Step 3: `requirements.txt`
**Open:** `requirements.txt`

**Say:** "New packages: `fastapi` and `uvicorn` for the web app, `pypdf` to read PDFs, `chromadb` for the search database."

**Run:**
```
pip install -r requirements.txt
```
**Expect:** it installs.

### Step 4: `sample_contracts/`
**Open:** the folder, then `02_northstar_bank.pdf`.

**Say:** "15 made-up contracts to practise on. Never use real client contracts in class."

---

## Part B: The upload pipeline (PDF to searchable clauses)

### Step 5: `app/ingest/ingest_service.py`
**Open:** `app/ingest/ingest_service.py`

**Say:** "The whole upload in 5 lines: read the pages, cut them into clauses, save the text, save the clauses as numbers. A scanned PDF with no text raises `UnreadablePdfError`."

### Step 6: `app/ingest/chunker.py`
**Open:** `app/ingest/chunker.py`

**Say:**
- "A new clause starts at a numbered heading like `9.3 SECURITY INCIDENTS`."
- "Each clause keeps its **page** and **heading**. That's how answers can cite `[p.5, 9.3 ...]`."
- "Page headers and footers are thrown away. The patterns are in `settings.yaml`."

**Run:**
```
python -c "from app.ingest.chunker import chunk_pages; print(chunk_pages(['1. Fees' + chr(10) + 'Invoices are payable within thirty (30) days of the invoice date.'])[0])"
```
**Expect:**
```
{'chunk_id': 'c0001', 'page': 1, 'clause_no': '1', 'heading': '1 Fees', 'text': '1. Fees Invoices are payable within thirty (30) days of the invoice date.'}
```

### Step 7: `app/ingest/vector_store.py`
**Open:** `app/ingest/vector_store.py`

**Say:**
- "Each clause becomes a list of numbers (an embedding), saved in **Chroma**, a database on our own disk."
- "To search, the question becomes numbers too, and Chroma finds the clauses closest in meaning."
- "`_prefix` adds a small label that the embed model expects. That's why `settings.yaml` has `document_prefix` and `query_prefix`."

### Step 8: `app/core/doc_store.py`
**Open:** `app/core/doc_store.py`

**Say:** "It keeps each contract's page text, and later its summary, as files in `copilot/data/`. An unknown id raises `NotFoundError`."

---

## Part C: What grew in the step 1 files

### Step 9: `app/core/config.py`
**Open:** `app/core/config.py`. Read the three **"New in step 2"** comments aloud: `data_dir`, `render`, `format_clauses`.

**Run:**
```
python -c "from app.core.config import format_clauses; print(format_clauses([{'page': 5, 'heading': '7.3 FEES', 'text': 'Invoices are payable within 60 days.'}]))"
```
**Expect:**
```
[p.5, 7.3 FEES]
Invoices are payable within 60 days.
```
**Say:** "This is exactly how clauses are pasted into the prompt, with their page and heading."

### Step 10: `config/settings.yaml`
**Open:** `config/settings.yaml`

**Say:**
- "`retrieval:` holds how many clauses to fetch, and `question_synonyms`: the everyday word, then the contract's word. 'breach' also searches 'security incident'."
- "`summary:` holds the 9 sections of the summary."
- "We change behaviour here, not in code."

### Step 11: `app/core/errors.py` and `app/core/tracing.py`
**Open:** `errors.py`, then `tracing.py`.

**Say:**
- "Two new errors, each with its web code: `NotFoundError` is 404, `UnreadablePdfError` is 422. A model failure is 503."
- "`tag_trace` adds the document id to the Langfuse record, and `current_trace_id` lets each answer point to its record."

### Step 11a: One PDF through the ingest service
**Open:** `app/ingest/ingest_service.py` and `app/ingest/chunker.py` side by side.

**Say:** "Let's watch one contract go through the upload pipeline, first without the AI, then all the way into the search database."

**Run part 1, pages and clauses (no model needed):**
```
python -c "from app.ingest.ingest_service import extract_pages; from app.ingest.chunker import chunk_pages; pages = extract_pages(open('sample_contracts/02_northstar_bank.pdf', 'rb').read()); print(len(pages), 'pages'); clauses = chunk_pages(pages); print(len(clauses), 'clauses'); print(next(c for c in clauses if c['clause_no'] == '9.3'))"
```
**Expect:**
```
11 pages
75 clauses
{'chunk_id': 'c0034', 'page': 5, 'clause_no': '9.3', 'heading': '9.3 INFORMATION SECURITY AND SECURITY INCIDENTS', 'text': '9.3 The Service Provider shall notify the Client within twelve (12) hours of confirming a Security Incident ...'}
```
**Say:** "The PDF became 11 pages of text, then 75 clauses. Each clause keeps its page and heading. That is what lets an answer cite `[p.5, 9.3 ...]`."

**Run part 2, the full ingest, saved and searchable** (Ollama must be on):
```
set BIFROST_URL=http://localhost:11434/v1
python -c "from app.ingest.ingest_service import ingest_pdf; print(ingest_pdf('02_northstar_bank.pdf', open('sample_contracts/02_northstar_bank.pdf', 'rb').read()))"
```
**Expect** (the `doc_id` is different every time):
```
{'doc_id': 'doc-08e02986bc', 'file_name': '02_northstar_bank.pdf', 'pages': 11, 'clauses': 75}
```
**Say:** "Same pipeline, but now every clause was turned into numbers by the embed model and saved in Chroma. Open `copilot/data`: a `documents` folder with the page text, and a `chroma` folder with the vectors. Uploading in the web app does exactly this."

> Part 1 saves nothing. Part 2 saves into `copilot/data`, like a real upload; that folder is git-ignored, so nothing goes to GitHub.

---

## Part D: Asking questions

### Step 12: `app/rag/retriever.py`
**Open:** `app/rag/retriever.py`

**Say:** "Hybrid search. First by meaning, then clauses that contain the question's own words move up. `_contract_terms` swaps everyday words for the contract's words. And the first clauses, the parties, are always included."

### Step 13: `prompts/chat_answer.md`
**Open:** `prompts/chat_answer.md`

**Say:**
- "The prompt is a file, not code. `$clauses` and `$question` are filled in by `render()`."
- "The rules: answer only from these clauses, cite the page, otherwise reply exactly 'Not found in the document.'"

### Step 14: `app/rag/answerer.py`
**Open:** `app/rag/answerer.py`

**Say:** "Search, fill the prompt, ask the analyst, return the answer. If no clause was found, we don't even call the model."

### Step 15: `app/rag/summariser.py` and `prompts/summarise_agreement.md`
**Open:** both.

**Say:**
- "For each of the 9 sections it searches for clauses, then asks the model **once** for all 9 summaries, as JSON."
- "The sources, clause and page, are attached by **Python** from the search, never by the model. So a page number can't be made up."
- "It's saved after the first time, so the second request is instant."

---

## Part E: The web app

### Step 16: `app/api/routes_documents.py` and `app/main.py`
**Open:** `routes_documents.py`, then `main.py`.

**Say:**
- "`@router.post('/documents')` turns a function into a web address. That's a decorator, from doc 5."
- "4 addresses: upload, page text, summary, ask."
- "`main.py` creates the app and turns our named errors into web codes, in one place."

### Step 17: Start the app
**Run** (straight to Ollama, no Docker needed):
```
set BIFROST_URL=http://localhost:11434/v1
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
**Expect:** `Uvicorn running on http://127.0.0.1:8000`. Leave this window open.

### Step 18: Try it in the browser
**Open:** http://127.0.0.1:8000/api/docs

1. **`POST /api/documents`** → Try it out → choose `sample_contracts\02_northstar_bank.pdf` → Execute.
   **Expect:** `{"doc_id":"doc-...","file_name":"02_northstar_bank.pdf","pages":11,"clauses":75}`. Copy the `doc_id`.
2. **`POST /api/ask`** → paste the `doc_id`, question `How quickly must a data breach be reported?`
   **Expect:** "The Service Provider shall notify the Client within twelve (12) hours of confirming a Security Incident affecting Client Data. [p.5, 9.3 INFORMATION SECURITY AND SECURITY INCIDENTS]"
   **Say:** "We asked about a 'breach'. The contract says 'Security Incident'. The synonym found it."
3. **`POST /api/ask`** → question `What is the cafeteria menu?`
   **Expect:** `Not found in the document.` **Say:** "An honest 'I don't know' instead of a made-up answer."
4. **`GET /api/documents/{doc_id}/summary`** → paste the `doc_id`.
   **Expect:** an overview and 9 sections, each with its sources. It takes about a minute the first time.
5. **`GET /api/documents/{doc_id}`** with `doc-nope`.
   **Expect:** `404` and `{"detail":"Unknown document doc-nope. Upload it again."}` That's `NotFoundError` turned into a web code.

### Step 19: The same with curl (optional)
In a **second** cmd window, from `copilot`:
```
curl http://127.0.0.1:8000/api/health
curl -F "file=@sample_contracts\02_northstar_bank.pdf" http://127.0.0.1:8000/api/documents
```
**Expect:** `{"status":"ok"}`, then the upload reply with a `doc_id`.
```
curl http://127.0.0.1:8000/api/ask -H "Content-Type: application/json" -d "{\"doc_id\":\"doc-PASTE-HERE\",\"question\":\"How quickly must a data breach be reported?\"}"
```
**Expect:** the same cited answer as step 18.

### Step 20: Through Bifrost and Langfuse
- **Stop the app:** press Ctrl+C in its window.
- **Start the containers** in a new cmd window:
  ```
  cd ..\infra\langfuse
  docker compose start
  docker start paynest-bifrost
  cd ..\..\copilot
  ```
- **Start the app with `.env.local`:**
  ```
  paynestenv\Scripts\activate
  uvicorn app.main:app --host 127.0.0.1 --port 8000 --env-file .env.local
  ```
- **Upload and ask again** in the browser.
- **Show:**
  - **Langfuse** (http://localhost:3000): the `ingest`, `answer`, `retrieve.question` and `llm.chat` records, with the document id.
  - **Bifrost** (http://localhost:8080): Logs.

**Say:** "Every step of RAG is on record."

### Step 21: `copilot/data/`
**Open:** the `copilot/data` folder.

**Say:** "Uploaded contracts, clauses and summaries live here on our disk. `.gitignore` keeps this folder off GitHub. Real contracts must never leave the machine."

---

## Part F: Testing

### Step 22: `tests/conftest.py`
**Open:** `tests/conftest.py`

**Say:** "Our first fixture, `isolated_data_dir`. `autouse=True` means every test gets its own throwaway folder, so tests never touch the real `data/`."

### Step 23: The new tests
**Open:** `test_chunker.py`, `test_retriever.py`, `test_summariser.py`.

**Say:**
- "**`test_chunker`:** headings and pages are kept, a clause running over a page break stays one clause, and '30 days' isn't mistaken for a heading."
- "**`test_retriever`:** 'breach' also searches 'security incident', but 'repayment' doesn't count as 'pay'."
- "**`test_summariser`:** sources come from Python, the second call is cached, and bad model output fails loudly. The `doc_id` fixture there is a fixture a test asks for by name."

**Run:**
```
python -m pytest -v
```
**Expect:** 13 tests listed, each `PASSED`, and `13 passed`.

### Step 24: Break it on purpose
**Open:** `config/settings.yaml`. Under `question_synonyms`, delete the line `breach: [security incident]`.

**Run:**
```
python -m pytest -q
```
**Expect:** `1 failed, 12 passed`. The failure is `test_breach_also_searches_for_security_incident`.

**Say:** "Even a settings change is protected by a test." **Put the line back** and run again. **Expect:** `13 passed`.

---

## Part G: The notebook, and wrap up

### Step 25: `notebooks/02_rag.ipynb`
**Open:** the notebook (it needs Bifrost running, from step 20).

**Say:** "The same 5 ideas, one cell at a time: PDF to clauses, clauses to numbers and search, a cited answer, an honest 'Not found', and a summary."

### Step 26: Wrap up
**Say:** "We read a contract, cut it into clauses, search by meaning and by words, and answer only from what we found, with the page. Next: step 3, the review agent."

**Give students:** `docs/6_documents_and_rag.md`.

**After class:**
- Stop the app with Ctrl+C.
- If the other project needs Docker:
  ```
  cd ..\infra\langfuse
  docker compose stop
  docker stop paynest-bifrost
  ```
