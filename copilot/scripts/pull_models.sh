#!/usr/bin/env bash
# One-time setup, after `make up`: pull every model named in config/settings.yaml into the Ollama container.
set -euo pipefail
cd "$(dirname "$0")/.."
COMPOSE="docker compose -f ../docker-compose.yml"

# Model names come only from settings.yaml, never from this script.
LIST_MODELS="from app.core.config import settings
print('\\n'.join(sorted({c['model'] for c in settings()['models'].values()})))"
MODELS=$($COMPOSE exec -T app python -c "$LIST_MODELS")

for model in $MODELS; do
  name="${model#ollama/}"   # the gateway profile adds an ollama/ prefix; Ollama itself does not use it
  echo "→ pulling ${name}"
  $COMPOSE exec -T ollama ollama pull "${name}"
done

echo "✓ Models ready."
