#!/usr/bin/env bash
# One-time setup: pull every model named in config/settings.yaml into the local Ollama.
# This is the only step that needs the internet.
set -euo pipefail
cd "$(dirname "$0")/.."

# Model names come only from settings.yaml, never from this script.
LIST_MODELS="from app.core.config import settings
print('\\n'.join(sorted({c['model'] for c in settings()['models'].values()})))"

for model in $(.venv/bin/python -c "$LIST_MODELS"); do
  echo "→ pulling ${model}"
  ollama pull "${model}"
done

echo "✓ Models ready."
