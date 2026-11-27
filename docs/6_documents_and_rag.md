# Step 2: documents and RAG

In step 1 the app could only talk to a model. Now it can **read a contract** and **answer questions about it, with the page it found the answer on**.

## 1. What is RAG?

**RAG = Retrieval-Augmented Generation.** In plain words:

1. **Retrieval:** find the few clauses that matter for the question.
2. **Augmented:** paste only those clauses into the prompt.
3. **Generation:** the model answers **from those clauses only**, and cites the page.

Why not give the model the whole contract? A contract is long, a small local model can only read so much at once, and it would make more mistakes. Giving it **only the right clauses** keeps answers short, correct and checkable.

---

## 2. The flow

**Upload** (once per contract):

```
 PDF --> pages of text --> clauses (chunks) --> numbers (embeddings) --> Chroma (local database)
      ingest_service     chunker               gateway.embed            vector_store
```

**Ask** (every question):

```
 question --> search Chroma --> top clauses --> prompt --> analyst model --> answer with [p.5, 9.3 ...]
             retriever                         render       gateway.chat     or "Not found in the document."
```

**Summary** (once per contract, then cached):

```
 9 sections (fees, liability, ...) --> search each --> ONE prompt --> analyst --> overview + 9 short summaries
```

---

## 3. What each new file does

```
copilot/
|-- app/
|   |-- main.py                  starts the web app (FastAPI)
|   |-- api/routes_documents.py  the web addresses: upload, ask, summary
|   |-- ingest/
|   |   |-- ingest_service.py    the upload pipeline, start to end
|   |   |-- chunker.py           cuts pages into clauses
|   |   `-- vector_store.py      saves and searches clauses in Chroma
|   |-- rag/
|   |   |-- retriever.py         finds the best clauses for a question
|   |   |-- answerer.py          writes the cited answer
|   |   `-- summariser.py        writes the key-terms summary
|   `-- core/doc_store.py        keeps each contract's page text on disk
|-- prompts/
|   |-- chat_answer.md           the prompt for answering a question
|   `-- summarise_agreement.md   the prompt for the summary
|-- sample_contracts/            15 made-up contracts to practise on
`-- tests/                       test_chunker, test_retriever, test_summariser
```

| File | Its job, in one line |
|---|---|
| `ingest_service.py` | PDF in, then pages, clauses, numbers, saved. Returns the new `doc_id` |
| `chunker.py` | A new clause starts at a numbered heading like `9.3 SECURITY INCIDENTS`. Each clause keeps its **page** and **heading**, so answers can cite them |
| `vector_store.py` | Saves each clause as numbers in **Chroma**, a database on your own disk. Search = "find the clauses closest in meaning" |
| `doc_store.py` | Saves the page text and the summary as files in `copilot/data/` |
| `retriever.py` | **Hybrid search:** first by meaning, then it moves clauses that contain the question's own words to the top. It also adds the contract's words for everyday words: "breach" also searches "security incident" |
| `answerer.py` | Fills the `chat_answer` prompt with the clauses and the question, asks the analyst, returns the answer |
| `summariser.py` | Searches once per section, asks the model **once** for all 9 summaries, and attaches the sources itself (the model never invents a page number) |
| `routes_documents.py` | Turns functions into web addresses with `@router.post` and `@router.get` (see doc 5) |
| `main.py` | Creates the app, and turns our named errors into web error codes (404, 422, 503) |

### What grew in the step 1 files

| File | New in step 2 |
|---|---|
| `config.py` | `data_dir()` (where files go), `render()` (fills a prompt), `format_clauses()` (clauses to text). Each has an In/Out comment |
| `errors.py` | `NotFoundError` (unknown document, web code 404), `UnreadablePdfError` (scanned PDF, 422) |
| `tracing.py` | `current_trace_id()` and `tag_trace()`: each answer links to its Langfuse record |
| `settings.yaml` | `retrieval:` (how many clauses, the synonyms) and `summary:` (the 9 sections) |
| `tests/conftest.py` | Our first fixture, `isolated_data_dir`: every test saves its files in a throwaway folder |

### The new packages (`requirements.txt`)

| Package | Why |
|---|---|
| `fastapi`, `uvicorn` | The web app, and the program that runs it |
| `python-multipart`, `pydantic` | Reading uploaded files, and checking the data we receive |
| `pypdf` | Reading text out of a PDF |
| `chromadb` | The local vector database |

---

## 4. Run it (cmd)

Ollama must be on. Work from the `copilot` folder.

**Install the new packages:**

```
paynestenv\Scripts\activate
cd copilot
pip install -r requirements.txt
```

**Start the app, straight to Ollama (no Docker needed):**

```
set BIFROST_URL=http://localhost:11434/v1
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Leave this window open. It shows every request.

**Or start it through Bifrost and Langfuse** (start them first, see doc 3). In a **new** cmd window:

```
uvicorn app.main:app --host 127.0.0.1 --port 8000 --env-file .env.local
```

`--env-file .env.local` loads the 3 gateway lines and the Langfuse keys from step 1.

### Try it in the browser

Open **http://127.0.0.1:8000/api/docs**. Every web address is listed. Click one, then **Try it out**, then **Execute**.

1. `POST /api/documents`: choose `sample_contracts\02_northstar_bank.pdf`. Copy the `doc_id` it returns.
2. `POST /api/ask`: paste the `doc_id`, ask "How quickly must a data breach be reported?"
3. `GET /api/documents/{doc_id}/summary`: the key-terms summary (about a minute the first time).

### Or with curl (a second cmd window)

```
curl http://127.0.0.1:8000/api/health
curl -F "file=@sample_contracts\02_northstar_bank.pdf" http://127.0.0.1:8000/api/documents
curl http://127.0.0.1:8000/api/ask -H "Content-Type: application/json" -d "{\"doc_id\":\"doc-PASTE-HERE\",\"question\":\"How quickly must a data breach be reported?\"}"
```

You should see:

```
{"status":"ok"}
{"doc_id":"doc-...","file_name":"02_northstar_bank.pdf","pages":11,"clauses":75}
{"answer":"The Service Provider shall notify the Client within twelve (12) hours of confirming a Security Incident ... [p.5, 9.3 INFORMATION SECURITY AND SECURITY INCIDENTS]","found":true,...}
```

Ask something that is not in the contract ("What is the cafeteria menu?") and you get `Not found in the document.`

### Run the tests

```
python -m pytest -q
```

You should see `13 passed`. No models or Docker needed.

---

## 5. Where the data goes

Uploaded contracts, their clauses and summaries are saved in **`copilot/data/`**, on your own disk.
`.gitignore` keeps that folder off GitHub. **Real client contracts must never leave the machine.**

---

## If something goes wrong

| You see | Fix |
|---|---|
| `No module named 'fastapi'` (or `chromadb`) | `pip install -r requirements.txt` |
| `Address already in use` / port 8000 busy | An old app is still running. Close its window, or use `--port 8001` |
| `503` from ask or summary | The model is not reachable: Ollama is off, or Bifrost is off when using `--env-file` |
| `422` on upload | A scanned PDF with no text. Use one from `sample_contracts` |
| `404 Unknown document` | Wrong `doc_id`, or it was uploaded to a different setup. Upload again |
| Old settings still used | A `set` from earlier is still active. Open a new cmd window |

**Next:** the teaching notebook `notebooks/02_rag.ipynb` shows the same steps one cell at a time.
