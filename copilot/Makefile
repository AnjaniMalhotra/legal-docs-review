# PayNest Contract Copilot — common commands (run natively; see README).
RUN = ./scripts/run.sh

.PHONY: install setup up gateway test smoke notebook

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

smoke:            ## one prompt per role
	$(RUN) python scripts/smoke_test_roles.py

notebook:         ## teaching notebooks (../notebooks): standalone, they import nothing from the app
	$(RUN) jupyter lab ../notebooks
