# PayNest Contract Copilot · Step 1 of 4: Setup

A fully local AI copilot that reviews client contracts against PayNest's Contracting Standards.
This branch is **step 1** of the learning path in [../STEPS.md](../STEPS.md); `full-docker` holds the finished project.

## In this step
- `app/core/`: the gateway (the only door to the models), settings, tracing and errors.
- Two model roles, `analyst` (Qwen 2.5 7B) and `embed` (nomic-embed-text), served by Ollama through **Bifrost** and traced in **Langfuse**.
- `infra/`: Bifrost (with a model allowlist) and self-hosted Langfuse in Docker.

## Run it

On Windows (cmd), follow `../docs/README.md` in order: Ollama (doc 2), Bifrost and Langfuse (doc 3), then this app (doc 4).
The `make` commands and `scripts/run.sh` are shortcuts for Mac and Linux.

## Teaching notebook
`../notebooks/00_hello_ollama.ipynb`, then `../notebooks/01_hello_llm.ipynb`.

## Next step
`git checkout step-2-rag`: turn PDFs into searchable clauses and answer questions with citations.
