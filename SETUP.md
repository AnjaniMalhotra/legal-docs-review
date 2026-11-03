# Setup Guide: PayNest Contract Copilot (full Docker)

From an unzipped folder to everything running in Docker: the Contract Copilot portal, Ollama, the Bifrost
gateway, Langfuse tracing, the marketing website and the teaching deck. Copy each block into a terminal, in order.

**Time:** about 30–45 minutes the first time (most of it is downloading ~10 GB of models and the Docker images).
**Internet:** needed only for steps 1, 4 and 5. After that everything runs offline.

| What | Address |
|---|---|
| Contract Copilot (the app) | http://localhost:8000 |
| Langfuse (traces of every step) | http://localhost:3000 |
| Bifrost (model gateway and call log) | http://localhost:8080 |
| Marketing website | http://localhost:5500 |
| Teaching presentation | http://localhost:5600 |
| Teaching notebooks (after `make notebook`) | http://localhost:8888 |

Ollama also runs in Docker but has no address on your machine: only Bifrost can reach the models.

---

## 0. What you need

- A **Mac** or **Linux** machine. On Windows, run everything inside WSL2 (Ubuntu).
- **16 GB RAM or more.** Docker has to hold the models and all the services at once, so 8 GB is not enough.
- About **30 GB** of free disk.

> **Speed on a Mac:** Docker on a Mac cannot use the Apple GPU, so the models run on the CPU and reviews are
> much slower. On Linux with an NVIDIA GPU, uncomment `gpus: all` in `docker-compose.yml`.

## 1. Install the tools (once)

**macOS** (installs [Homebrew](https://brew.sh) first if you don't have it):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install colima docker docker-compose
mkdir -p ~/.docker/cli-plugins && ln -sfn "$(brew --prefix)/opt/docker-compose/bin/docker-compose" ~/.docker/cli-plugins/docker-compose
```

**Linux (Ubuntu):**
```bash
sudo apt update && sudo apt install -y make curl openssl docker.io docker-compose-v2
sudo usermod -aG docker $USER    # then log out and back in
```

Check:
```bash
docker --version && docker compose version
```

## 2. Start Docker

**macOS** (Linux: skip this). If Colima is already running with less memory, run `colima stop` first:
```bash
colima start --cpu 4 --memory 12 --disk 60
```

## 3. Create your own secrets (once)

The zip does **not** contain anyone's passwords or keys. This block generates fresh ones for your machine
and writes the three settings files. Run it from the project root:

```bash
cd "Legal Docs Project"
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

echo "Langfuse login → email: admin@paynest.local   password: $PW   (also saved in infra/langfuse/.env)"
```

Write down the Langfuse password it prints.

## 4. Start everything

```bash
cd "Legal Docs Project/copilot"
make up     # builds the app and starts all services (the first time downloads the images)
```

## 5. Download the models (once, ~10 GB)

```bash
make setup  # pulls qwen2.5:7b-instruct, llama3.1:8b, nomic-embed-text into the Ollama container
```

The models are kept in a Docker volume, so `make down` and `make up` do not download them again.

## 6. Check it works

```bash
curl -s http://localhost:8000/api/health    # → {"status":"ok","standards_version":"v1.0"}
make test                                   # expect: 61 passed (no models needed)
make smoke                                  # one prompt per model role; each appears in Langfuse
```

Check that the gateway can reach the models, and that it refuses anything not on its allowlist:
```bash
curl -s http://127.0.0.1:8080/v1/embeddings -H 'Content-Type: application/json' \
  -d '{"model":"ollama/nomic-embed-text","input":"hello"}' | head -c 80; echo        # → {"data":[{"embedding":…
curl -s http://127.0.0.1:8080/v1/embeddings -H 'Content-Type: application/json' \
  -d '{"model":"ollama/llama3.2:1b","input":"hello"}' | head -c 120; echo           # → no keys found that support model
```

**Try it:** open http://localhost:8000, enter a matter name, upload a PDF from `copilot/sample_contracts/`,
then open the Summary, ask a question in the chat, and run the review. The first request is slow while the
model loads.

**The presentation:** keys ← → to move, **O** for an overview of all slides, **F** for fullscreen. It can also
be opened directly by double-clicking `presentation/index.html`.

---

## Tracking everything

| What you want to see | Where |
|---|---|
| Every step of a review or chat: retrieved clauses, prompts, answers, timings | **Langfuse** → http://localhost:3000 → project *Contract Copilot* → Tracing |
| Every model call: which model, how long, allowed or refused | **Bifrost** → http://localhost:8080 → Logs |
| Lawyer decisions with name and time | The app → **Audit trail** tab |
| What the models are doing right now | `docker compose exec ollama ollama ps` |
| Live app log | `make logs` |
| Which services are running | `docker compose ps` |
| Teaching notebooks (one per step) | `make notebook`, then open the link it prints, using `localhost` as the address |
| Quality scores on the sample contracts | `make evals` (all 5 in the answer key), or `make evals ARGS="--contract lexmore"` for one; results print per contract and are saved in `copilot/data/evals/latest.json` |
| Proof the presentation sends nothing out | the **External requests** counter in the deck's top-right corner (stays at 0) |

## Everyday start and stop

Run these from `copilot/`:
```bash
colima start        # macOS only
make up             # start everything; also rebuilds the app after a code change
make down           # stop everything (models, contracts and traces are kept)
colima stop         # macOS only
```

## Troubleshooting

| Problem | Fix |
|---|---|
| A review is very slow or times out | Docker on a Mac uses the CPU only. Close other apps and check `docker stats`; a Linux machine with an NVIDIA GPU is much faster |
| A service keeps restarting, or the model fails to load | Docker needs more memory: `colima stop`, then `colima start --cpu 4 --memory 12` |
| `no keys found that support model` in the app | The model isn't on Bifrost's allowlist: add it to `infra/bifrost/config.json`, then `docker compose restart bifrost` |
| `Model role 'analyst' failed` | The models aren't pulled: run `make setup`, and check `docker compose logs ollama` |
| Port already in use (8000, 3000, 8080, 5500, 5600) | Another program is using it: `lsof -i :8000`, then stop it |
| `env file … not found` | Create the secrets first (step 3) |
| Langfuse shows no traces | Check the keys in `copilot/.env.local` match `infra/langfuse/.env`, then run `make up` again |
| A code or prompt change doesn't show | Run `make up` again; it rebuilds the app |
| The website or deck shows an old version | Reload with Cmd+Shift+R |

## Sharing this project as a zip

Leave out everyone's private data, keys and logs:
```bash
cd ..   # the folder that contains "Legal Docs Project"
zip -r PayNest-Contract-Copilot.zip "Legal Docs Project" \
  -x "*/.venv/*" "*/data/*" "*/.env" "*/.env.local" "*/logs/*" "*/__pycache__/*" "*/.pytest_cache/*" "*.DS_Store"
```
The receiver then follows this guide from step 1. `copilot/data/` holds uploaded contracts and must never be shared.

## Where to read next

| | |
|---|---|
| Learn it in 4 steps (branches + notebooks) | `STEPS.md` |
| The business and its clients | `docs/1_company_and_clients.md` |
| The company policy the tool checks against | `policies/PayNest_Contracting_Standards.md` |
| How the system works | `docs/3_architecture.md` |
| Each tool and every code file | `docs/4_tech_stack.md` |
