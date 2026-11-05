# PayNest Contract Copilot — common commands (run natively; see README).
RUN = ./scripts/run.sh

.PHONY: install setup up gateway test test-step5 test-live smoke notebook evals

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

test-step5:       ## only the step 5 tests (no models needed)
	.venv/bin/python -m pytest tests/step5 -v

test-live:        ## step 5 tests with the real models (needs Ollama and Bifrost running)
	RUN_LIVE_TESTS=1 $(RUN) python -m pytest tests/step5/test_9_live_models.py -v

smoke:            ## one prompt per role
	$(RUN) python scripts/smoke_test_roles.py

notebook:         ## teaching notebooks (../notebooks): standalone, they import nothing from the app
	$(RUN) jupyter lab ../notebooks

evals:            ## golden-set evals; one contract: make evals ARGS="--contract lexmore"
	$(RUN) python -m evals.run_evals $(ARGS)
