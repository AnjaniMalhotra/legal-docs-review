#!/usr/bin/env bash
# Generates this machine's passwords and keys once. Never overwrites existing files.
set -euo pipefail
cd "$(dirname "$0")/../.."
umask 077

FILES=(infra/langfuse/.env infra/bifrost/.env copilot/.env.local)
found=0
for f in "${FILES[@]}"; do [ -f "$f" ] && found=$((found + 1)); done
if [ "$found" -eq "${#FILES[@]}" ]; then echo "✓ Secrets already exist."; exit 0; fi
if [ "$found" -gt 0 ]; then
  echo "✗ Only some secret files exist, and their keys must match. Expected: ${FILES[*]}" >&2
  exit 1
fi

rnd() { openssl rand -hex "$1"; }
PG=$(rnd 16); CH=$(rnd 16); RD=$(rnd 16); MN=$(rnd 16)
PK="pk-lf-$(rnd 16)"; SK="sk-lf-$(rnd 16)"; PW=$(rnd 8)

cat > infra/langfuse/.env <<EOF
TELEMETRY_ENABLED=false
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(rnd 32)
SALT=$(rnd 16)
ENCRYPTION_KEY=$(rnd 32)
POSTGRES_PASSWORD=$PG
DATABASE_URL=postgresql://postgres:$PG@postgres:5432/postgres
CLICKHOUSE_PASSWORD=$CH
REDIS_AUTH=$RD
MINIO_ROOT_PASSWORD=$MN
LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=$MN
LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY=$MN
LANGFUSE_S3_BATCH_EXPORT_SECRET_ACCESS_KEY=$MN
LANGFUSE_INIT_ORG_ID=paynest
LANGFUSE_INIT_ORG_NAME=PayNest
LANGFUSE_INIT_PROJECT_ID=contract-copilot
LANGFUSE_INIT_PROJECT_NAME=Contract Copilot
LANGFUSE_INIT_PROJECT_PUBLIC_KEY=$PK
LANGFUSE_INIT_PROJECT_SECRET_KEY=$SK
LANGFUSE_INIT_USER_EMAIL=admin@paynest.local
LANGFUSE_INIT_USER_NAME=Admin
LANGFUSE_INIT_USER_PASSWORD=$PW
EOF

echo "LANGFUSE_OTEL_AUTH=Basic $(printf '%s:%s' "$PK" "$SK" | base64 | tr -d '\n')" > infra/bifrost/.env

cat > copilot/.env.local <<EOF
GATEWAY_API_KEY=local
LANGFUSE_PUBLIC_KEY=$PK
LANGFUSE_SECRET_KEY=$SK
EOF

echo "✓ Secrets created. Langfuse login is in infra/langfuse/.env"
