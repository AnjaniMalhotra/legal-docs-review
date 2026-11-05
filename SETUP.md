# Setup Guide: PayNest Contract Copilot

From an unzipped folder to everything running: the Contract Copilot portal, the Bifrost gateway,
Langfuse tracing, the marketing website and the teaching deck. Copy each block into a terminal, in order.

**Time:** about 30–45 minutes the first time (most of it is downloading ~10 GB of models).
**Internet:** needed only for installing tools and downloading models (steps 1–4). After that everything runs offline.

| What | Address | Started in |
|---|---|---|
| Contract Copilot (the app) | http://localhost:8000 | Step 6 |
| Langfuse (traces of every step) | http://localhost:3000 | Step 5 |
| Bifrost (model gateway and call log; login `admin`, password in `infra/bifrost/.env`) | http://localhost:8080 | Step 5 |
| Ollama (the AI models) | http://localhost:11434 | Step 3 |
| Marketing website | http://localhost:5500 | Step 7 |
| Teaching presentation | http://localhost:5600 | Step 7 |

---

## 0. What you need

- A **Mac** (Apple Silicon recommended) or **Linux** machine. On Windows, run everything inside WSL2 (Ubuntu).
- **16 GB RAM** recommended. 8 GB works, but close other apps before running a review.
- About **20 GB** of free disk.

## 1. Install the tools (once)

**macOS** (installs [Homebrew](https://brew.sh) first if you don't have it):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python@3.12 ollama colima docker docker-compose
mkdir -p ~/.docker/cli-plugins && ln -sfn "$(brew --prefix)/opt/docker-compose/bin/docker-compose" ~/.docker/cli-plugins/docker-compose
```

**Linux (Ubuntu):**
```bash
sudo apt update && sudo apt install -y python3.12 python3.12-venv make curl openssl docker.io docker-compose-v2
curl -fsSL https://ollama.com/install.sh | sh
sudo usermod -aG docker $USER    # then log out and back in
```

Check:
```bash
python3.12 --version && ollama --version && docker --version && docker compose version
```

## 2. Unzip and set up Python

```bash
cd "Legal Docs Project/copilot"
python3.12 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest -q          # expect: all tests pass (no models needed)
```

## 3. Start Ollama and download the models (once, ~10 GB)

```bash
ollama serve > /tmp/ollama.log 2>&1 &    # skip if the Ollama app is already running (menu-bar llama icon)
cd "Legal Docs Project/copilot"
make setup                               # pulls qwen2.5:7b-instruct, llama3.1:8b, nomic-embed-text
ollama list                              # all three should be listed
```

> **Linux only:** Docker containers must reach Ollama, so start it with `OLLAMA_HOST=0.0.0.0 ollama serve`.

## 4. Create your own secrets (once)

The zip does **not** contain anyone's passwords or keys. One script generates fresh ones for your machine and
writes the three settings files (Langfuse, Bifrost and the app). Run it from the project root:

```bash
cd "Legal Docs Project"
copilot/scripts/create_secrets.sh
cat >> copilot/.env.local <<EOF          # the app talks to the models through Bifrost, traced in Langfuse
SETTINGS_PROFILE=gateway
BIFROST_URL=http://127.0.0.1:8080/v1
LANGFUSE_HOST=http://127.0.0.1:3000
EOF
```

The script never overwrites existing files, so it is safe to run again. The Langfuse login (email and password) is in
`infra/langfuse/.env`, and the Bifrost login (user `admin`) is in `infra/bifrost/.env`. Write them down.

## 5. Start Docker, Langfuse and Bifrost

**macOS:** start the Docker virtual machine (Linux: skip this line):
```bash
colima start --cpu 4 --memory 4 --disk 40
```

Langfuse (first start downloads its images, a few minutes):
```bash
cd "Legal Docs Project/infra/langfuse"
docker compose up -d
until curl -s http://127.0.0.1:3000/api/public/health | grep -q OK; do sleep 5; done; echo "Langfuse is up"
```

Bifrost (the first time creates the container; afterwards just `docker start paynest-bifrost`):
```bash
cd "Legal Docs Project/infra/bifrost"
docker run -d --name paynest-bifrost --restart unless-stopped --network langfuse_default \
  -p 127.0.0.1:8080:8080 --add-host=host.docker.internal:host-gateway --env-file .env \
  -v "$PWD:/app/data" maximhq/bifrost:latest
```

Check that the gateway can reach the models, and that it refuses anything not on its allowlist:
```bash
curl -s http://127.0.0.1:8080/v1/embeddings -H 'Content-Type: application/json' \
  -d '{"model":"ollama/nomic-embed-text","input":"hello"}' | head -c 80; echo        # → {"data":[{"embedding":…
curl -s http://127.0.0.1:8080/v1/embeddings -H 'Content-Type: application/json' \
  -d '{"model":"ollama/llama3.2:1b","input":"hello"}' | head -c 120; echo           # → no keys found that support model
```

## 6. Start the Contract Copilot

```bash
cd "Legal Docs Project/copilot"
make up                       # → http://localhost:8000  (Ctrl+C to stop)
```

In a second terminal:
```bash
cd "Legal Docs Project/copilot"
curl -s http://localhost:8000/api/health    # → {"status":"ok","standards_version":"v1.0"}
make smoke                                  # one prompt per model role; each appears in Langfuse
```

**Try it:** open http://localhost:8000, enter a matter name, upload a PDF from `copilot/sample_contracts/`,
then open the Summary, ask a question in the chat, and run the review. The first request takes about a
minute while the model loads; a full review takes 5–10 minutes on a laptop.

## 7. The website and the presentation

Both are static pages. Each needs its own terminal:
```bash
cd "Legal Docs Project/website" && python3 -m http.server 5500 --bind 127.0.0.1         # → http://localhost:5500
cd "Legal Docs Project/presentation" && python3 -m http.server 5600 --bind 127.0.0.1    # → http://localhost:5600
```
The presentation can also be opened directly by double-clicking `presentation/index.html`.
Keys: ← → to move, **O** for an overview of all slides, **F** for fullscreen.

---

## Tracking everything

| What you want to see | Where |
|---|---|
| Every step of a review or chat: retrieved clauses, prompts, answers, timings | **Langfuse** → http://localhost:3000 → project *Contract Copilot* → Tracing |
| Every model call: which model, how long, allowed or refused | **Bifrost** → http://localhost:8080 → Logs |
| Lawyer decisions with name and time | The app → **Audit trail** tab |
| What the models are doing right now | `ollama ps` |
| Live app log | the terminal running `make up` |
| Teaching notebooks (one per step) | `cd copilot && make notebook` |
| Quality scores on the sample contracts | `make evals` (all 5 in the answer key), or `make evals ARGS="--contract lexmore"` for one; results print per contract and are saved in `copilot/data/evals/latest.json` |
| Proof the presentation sends nothing out | the **External requests** counter in the deck's top-right corner (stays at 0) |

## Everyday start and stop

Start (after the first setup):
```bash
ollama serve > /tmp/ollama.log 2>&1 &                       # if not already running
colima start --cpu 4 --memory 4                             # macOS only
cd "Legal Docs Project/infra/langfuse" && docker compose up -d && docker start paynest-bifrost
cd "../../copilot" && make up
```

Stop:
```bash
# Ctrl+C in the terminal running make up, then:
docker stop paynest-bifrost
cd "Legal Docs Project/infra/langfuse" && docker compose stop
colima stop                                                 # macOS only
for m in $(ollama ps | awk 'NR>1{print $1}'); do ollama stop $m; done    # free the models' memory
```

**Without Docker (lighter, no tracing):** rename `copilot/.env.local` to something else, then just run
`ollama serve` and `make up`. The app then talks to Ollama directly.

## Troubleshooting

| Problem | Fix |
|---|---|
| A review is very slow or times out | Close other apps; check `ollama ps`. 8 GB machines need almost everything else closed |
| `no keys found that support model` in the app | The model isn't on Bifrost's allowlist: add it to `infra/bifrost/config.json`, then `docker restart paynest-bifrost` |
| `Model role 'analyst' failed` | Ollama isn't running (`ollama serve`) or the models aren't pulled (`make setup`) |
| Port already in use (8000, 3000, 8080) | Another program is using it: `lsof -i :8000`, stop it, or set `APP_PORT=8001` in `copilot/.env.local` |
| `network langfuse_default not found` when creating Bifrost | Start Langfuse first (step 5) |
| Langfuse shows no traces | Check the keys in `copilot/.env.local` match `infra/langfuse/.env`, then restart `make up` |
| `python3.12: command not found` | Install Python 3.12 (step 1); any Python 3.11+ also works |
| The website or deck shows an old version | Reload with Cmd+Shift+R |

## Sharing this project as a zip

Leave out everyone's private data, keys and the large Python environment:
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
