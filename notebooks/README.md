# Notebooks

Two standalone demos of how the Contract Copilot's logic works. Each notebook holds all of its own code, so you can
read one from top to bottom without opening the app. The saved outputs are from a real run on local models.

| Notebook | Shows | Models used |
|---|---|---|
| `01_hello_llm.ipynb` | A role, the gateway, speed, embeddings, the allowlist | analyst, embed |
| `02_rag.ipynb` | PDF to clauses, hybrid search, cited answers, "Not found", a summary | analyst, embed |

`data/` is demo data only, and all of it is synthetic: one sample contract.

## Run them

They only need a model gateway: Bifrost at `http://127.0.0.1:8080/v1` (SETUP.md, section 5; set `BIFROST_URL` to use
another). Then either:

```bash
cd copilot && make notebook                      # uses the app's Python environment
pip install -r requirements.txt && jupyter lab   # or any Python, from this folder
```
