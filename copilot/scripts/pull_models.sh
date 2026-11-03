#!/usr/bin/env bash
# Pulls any model named in config/settings.yaml that the Ollama container does not have yet.
# Models already downloaded are skipped, so a normal start needs no internet.
set -euo pipefail
cd "$(dirname "$0")/.."
COMPOSE="docker compose -f ../docker-compose.yml"

# Model names come only from settings.yaml, never from this script.
LIST_MODELS="from app.core.config import settings
print('\\n'.join(sorted({c['model'] for c in settings()['models'].values()})))"
MODELS=$($COMPOSE exec -T app python -c "$LIST_MODELS")
INSTALLED=$($COMPOSE exec -T ollama ollama list)

for model in $MODELS; do
  name="${model#ollama/}"   # the gateway profile adds an ollama/ prefix; Ollama itself does not use it
  if grep -qE "^${name}[: ]" <<< "$INSTALLED"; then echo "✓ ${name}"; continue; fi
  echo "→ pulling ${name}"
  $COMPOSE exec -T ollama ollama pull "${name}"
done

echo "✓ Models ready."
