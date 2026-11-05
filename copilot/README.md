# PayNest Contract Copilot · Step 1 of 4: Setup

A fully local AI copilot that reviews client contracts against PayNest's Contracting Standards.
This branch is **step 1** of the learning path in [../STEPS.md](../STEPS.md); `full-docker` holds the finished project.

## In this step
- `app/core/`: the gateway (the only door to the models), settings, tracing and errors.
- Two model roles, `analyst` (Qwen 2.5 7B) and `embed` (nomic-embed-text), served by Ollama through **Bifrost** and traced in **Langfuse**.
- `infra/`: Bifrost (with a model allowlist) and self-hosted Langfuse in Docker.

## Run it
First-time setup of tools, models and secrets: [../SETUP.md](../SETUP.md) (sections 1–5).

```bash
make install && make setup     # Python packages and the model
make gateway                   # Bifrost + Langfuse
make smoke                     # one prompt → see it in Bifrost (:8080) and Langfuse (:3000)
make test
```

## Teaching notebook
`../notebooks/01_hello_llm.ipynb`: start it with `make notebook`.

## Next step
`git checkout step-2-rag`: turn PDFs into searchable clauses and answer questions with citations.
