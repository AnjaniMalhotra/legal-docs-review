# Local infrastructure: full Docker

Every service runs in Docker from `../docker-compose.yml`. Start it with `./start.sh` from the project root.

```
app (localhost:8000) ──> Bifrost (localhost:8080) ──> Ollama (no published port)
        │                        │
        └──── OTel traces ───────┴──> Langfuse (localhost:3000)  [Postgres, ClickHouse, Redis, MinIO, worker]

website (localhost:5500)    presentation (localhost:5600)
```

Inside Docker the services find each other by name: `bifrost`, `ollama`, `langfuse-web`.

Langfuse UI: http://localhost:3000. Login email and password are in `infra/langfuse/.env`
(`LANGFUSE_INIT_USER_EMAIL` / `LANGFUSE_INIT_USER_PASSWORD`); the organisation, project and API keys are
created automatically on first start.

## Files

| File | Holds |
|---|---|
| `../docker-compose.yml` | Every service, with ports bound to 127.0.0.1. Includes Langfuse's file below |
| `../copilot/Dockerfile` | Builds the app image; `.dockerignore` keeps secrets and contracts out |
| `langfuse/docker-compose.yml` | Langfuse's official self-host compose, with web and MinIO ports bound to 127.0.0.1 |
| `langfuse/.env` | Generated secrets, `TELEMETRY_ENABLED=false`, first-run org, project, keys and login (never committed) |
| `bifrost/config.json` | File-only config: Ollama provider, `models` allowlist (analyst, judge, embed only; update it when a model is swapped), OTel export to Langfuse |
| `bifrost/.env` | `LANGFUSE_OTEL_AUTH`, Basic auth for the OTel exporter (never committed) |
| `../copilot/.env.local` | Langfuse keys for the app (never committed) |
