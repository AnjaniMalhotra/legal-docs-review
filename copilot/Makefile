# PayNest Contract Copilot: common commands. Everything runs in Docker (see ../docker-compose.yml).
COMPOSE = docker compose -f ../docker-compose.yml
RUN = $(COMPOSE) exec app ./scripts/run.sh

.PHONY: up setup down logs test smoke notebook evals policy prompts red-team

up:               ## start every service → http://localhost:8000
	$(COMPOSE) up -d --build

setup:            ## one-time, after make up: pull the models (needs the internet)
	./scripts/pull_models.sh

down:             ## stop every service (models, contracts and traces are kept)
	$(COMPOSE) down

logs:             ## follow the app's log
	$(COMPOSE) logs -f app

test:             ## unit tests (no models needed)
	$(RUN) python -m pytest -q

smoke:            ## one prompt per role
	$(RUN) python scripts/smoke_test_roles.py

notebook:         ## teaching notebooks → http://localhost:8888
	$(RUN) jupyter lab --notebook-dir=/notebooks --ip 0.0.0.0 --port 8888 --no-browser --allow-root

policy:           ## rebuild ../policies from config/standards
	$(RUN) python scripts/build_policy_doc.py

prompts:          ## load prompts/*.md into Langfuse (once, and after editing a prompt)
	$(RUN) python scripts/push_prompts.py

red-team:         ## five attacks on the real models
	$(COMPOSE) exec -e RUN_RED_TEAM=1 app python -m pytest tests/test_red_team.py -v -s

evals:            ## golden-set evals; one contract: make evals ARGS="--contract lexmore"
	$(RUN) python -m evals.run_evals $(ARGS)
