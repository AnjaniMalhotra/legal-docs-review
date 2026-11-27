# PayNest Contract Copilot · Step 2 of 4: Documents + RAG

A fully local AI copilot that reviews client contracts against PayNest's Contracting Standards.
This branch is **step 2** of the learning path in [../STEPS.md](../STEPS.md); `full-docker` holds the finished project.

## In this step
- `app/ingest/`: PDF → pages → clause chunks → vectors in Chroma (`nomic-embed-text`).
- `app/rag/`: hybrid retrieval, cited chat answers with an honest "Not found", and a key-terms summary.
- `sample_contracts/`: 15 synthetic contract PDFs.
- API: upload, page text, summary and questions at `/api/docs`.

## Run it

On Windows (cmd), follow `../docs/README.md` in order. The `make` commands and `scripts/run.sh` are shortcuts for Mac and Linux.

## Teaching notebook
`../notebooks/02_rag.ipynb` (after `00_hello_ollama` and `01_hello_llm` from step 1).

## Next step
`git checkout step-3-review-agent`: PayNest's policies, the review agent and the web portal.
