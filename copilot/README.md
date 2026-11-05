# PayNest Contract Copilot · Step 3 of 4: Policies + review agent

A fully local AI copilot that reviews client contracts against PayNest's Contracting Standards.
This branch is **step 3** of the learning path in [../STEPS.md](../STEPS.md); `full-docker` holds the finished project.

## In this step
- `config/standards/` and `../policies/`: PayNest's 10 Contracting Standards.
- `app/policy/`: classifier, grounding guard, stricter-only checks, scoring, lawyer decisions, Issues List.
- `app/graph/`: the LangGraph review with a human gate (`interrupt`).
- `web/`: the full portal: summary, highlighted agreement, review, Issues List, audit trail, chat.

## Run it
First-time setup of tools, models and secrets: [../SETUP.md](../SETUP.md).

```bash
make gateway && make up        # → http://localhost:8000
make test                      # golden scores 49 / 43 / 3 / 29 / 18
```

## Teaching notebook
`../notebooks/03_review_agent.ipynb`: start it with `make notebook`.

## Next step
`git checkout step-4-evals`: measure quality with an answer key, a judge model and Ragas.
