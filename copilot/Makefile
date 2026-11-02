# PayNest Contract Copilot — common commands (run natively; see README).
RUN = ./scripts/run.sh

.PHONY: install setup up gateway test lines smoke notebook evals purge

install:          ## one-time: Python environment
	python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

setup:            ## one-time: pull the models (the only step that uses the internet)
	./scripts/pull_models.sh

up:               ## run the app → http://localhost:8000
	$(RUN)

gateway:          ## Option B: start Langfuse + Bifrost in Docker (see ../infra/README.md)
	cd ../infra/langfuse && docker compose up -d
	docker start paynest-bifrost

test:             ## unit tests (no models needed)
	.venv/bin/python -m pytest -q

lines:            ## enforce the 120-line limit
	python3 scripts/check_line_limits.py

smoke:            ## one prompt per role
	$(RUN) python scripts/smoke_test_roles.py

notebook:         ## teaching notebooks (notebooks/) with the app's settings
	$(RUN) jupyter lab notebooks

evals:            ## golden-set evals; one contract: make evals ARGS="--contract lexmore"
	$(RUN) python -m evals.run_evals $(ARGS)

purge:            ## retention job
	$(RUN) python scripts/purge_old_data.py
