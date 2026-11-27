#!/usr/bin/env bash
# Run the copilot natively (Ollama on the Mac uses the GPU). Option B: add Bifrost + Langfuse
# from infra/ and set SETTINGS_PROFILE=gateway in .env.local.
#   ./scripts/run.sh python scripts/smoke_test_roles.py  → any command with these settings
# Requires: `ollama serve` running and the models pulled (`make setup`).
set -euo pipefail
cd "$(dirname "$0")/.."

# Local settings (gateway profile, Bifrost URL, Langfuse keys). Never committed.
if [ -f .env.local ]; then set -a; . ./.env.local; set +a; fi

export BIFROST_URL="${BIFROST_URL:-http://localhost:11434/v1}"   # Ollama's OpenAI-compatible API
export GATEWAY_API_KEY="${GATEWAY_API_KEY:-local}"
export HF_HOME="${HF_HOME:-$PWD/data/hf}" HF_HUB_OFFLINE=1
export ANONYMIZED_TELEMETRY=False
export LANGSMITH_TRACING=false LANGCHAIN_TRACING_V2=false
export PATH="$PWD/.venv/bin:$PATH"
if [ $# -eq 0 ]; then echo "Usage: ./scripts/run.sh <command>   (the web app arrives in step 2)"; exit 1; fi
exec "$@"
