#!/usr/bin/env bash
# Run the copilot natively (Ollama on the Mac uses the GPU). Option B: add Bifrost + Langfuse
# from infra/ and set SETTINGS_PROFILE=gateway in .env.local.
#   ./scripts/run.sh                          → app at http://localhost:8000
#   ./scripts/run.sh python -m evals.run_evals  → any command with the same environment
# Requires: `ollama serve` running and the models pulled (`make setup`).
set -euo pipefail
cd "$(dirname "$0")/.."

# Local settings (gateway profile, Bifrost URL, Langfuse keys). Never committed.
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi

export BIFROST_URL="${BIFROST_URL:-http://localhost:11434/v1}"   # Ollama's OpenAI-compatible API
export GATEWAY_API_KEY="${GATEWAY_API_KEY:-local}"
export HF_HOME="${HF_HOME:-$PWD/data/hf}" HF_HUB_OFFLINE=1
export ANONYMIZED_TELEMETRY=False RAGAS_DO_NOT_TRACK=true
export LANGSMITH_TRACING=false LANGCHAIN_TRACING_V2=false
export PATH="$PWD/.venv/bin:$PATH"
APP_PORT="${APP_PORT:-8000}"

if [ $# -gt 0 ]; then exec "$@"; fi
exec uvicorn app.main:app --host 127.0.0.1 --port "$APP_PORT"
