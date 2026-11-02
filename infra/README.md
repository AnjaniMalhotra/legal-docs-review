# Local infrastructure (Stage A): Bifrost + Langfuse on this Mac

The app and Ollama run natively (Ollama uses the Mac GPU); Bifrost and Langfuse run in Docker (Colima).

```
app (localhost:8000) ──> Bifrost (127.0.0.1:8080) ──> Ollama on the Mac (host.docker.internal:11434)
        │                        │
        └──── OTel traces ───────┴──> Langfuse (127.0.0.1:3000)  [Postgres, ClickHouse, Redis, MinIO, worker]
```

## Start

```bash
colima start --cpu 4 --memory 4 --disk 40
cd infra/langfuse && docker compose up -d                 # official compose file; secrets in .env
docker start paynest-bifrost                                 # created once, see "Bifrost container" below
ollama serve &                                               # if not already running
cd ../../copilot && make up                                # loads copilot/.env.local (gateway profile)
```

Langfuse UI: http://localhost:3000. Login email and password are in `infra/langfuse/.env`
(`LANGFUSE_INIT_USER_EMAIL` / `LANGFUSE_INIT_USER_PASSWORD`); the organisation, project and API keys were
created automatically on first start.

## Files (all local, never committed)

| File | Holds |
|---|---|
| `langfuse/docker-compose.yml` | Langfuse's official self-host compose, with web and MinIO ports bound to 127.0.0.1 |
| `langfuse/.env` | Generated secrets, `TELEMETRY_ENABLED=false`, first-run org, project, keys and login |
| `bifrost/config.json` | File-only config: Ollama provider (`allow_private_network` for the Mac host), `models` allowlist (analyst, judge, embed only; update it when a model is swapped), OTel export to Langfuse |
| `bifrost/.env` | `LANGFUSE_OTEL_AUTH` (Basic auth for the OTel exporter) |
| `../copilot/.env.local` | `SETTINGS_PROFILE=gateway`, Bifrost URL, Langfuse host and keys |

## Bifrost container (created once)

```bash
cd infra/bifrost
docker run -d --name paynest-bifrost --restart unless-stopped --network langfuse_default \
  -p 127.0.0.1:8080:8080 --add-host=host.docker.internal:host-gateway --env-file .env \
  -v "$PWD:/app/data" maximhq/bifrost:latest
```

## Findings from the Stage A test (30 Oct 2026)

- Bifrost denies all models by default (`models: []`) and blocks private IPs unless `allow_private_network` is set.
- Bifrost does not pass `response_format: json_object` through to Ollama; replies arrive in ```json fences.
  The classifier's JSON extraction handles this.
- Langfuse v4 runs in events-only mode: list traces with `GET /api/public/v2/observations`, not `/traces`.
- About 80% of stored observations are Bifrost `plugin.*` spans; consider the OTel `plugin_span_filter`.
- To do: pin `maximhq/bifrost` to a release at least two weeks old; run the no-egress check with Wi-Fi off.
