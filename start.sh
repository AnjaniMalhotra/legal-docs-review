#!/usr/bin/env bash
# Starts the whole project in Docker: run ./start.sh and every portal comes up. Safe to run again.
# Stop everything with: docker compose down
set -euo pipefail
cd "$(dirname "$0")"

MAX_DOCKER_GB="${MAX_DOCKER_GB:-12}"    # memory for Docker on a Mac
MIN_RAM_GB="${MIN_RAM_GB:-16}"          # below this, reviews may fail
WAIT_SECONDS="${WAIT_SECONDS:-300}"     # how long to wait for each service

step() { printf '\n▶ %s\n' "$*"; }
fail() { printf '\n✗ %s\n' "$*" >&2; exit 1; }

# Install Docker with Homebrew on a Mac if it is missing.
install_tools() {
  command -v docker >/dev/null && docker compose version >/dev/null 2>&1 && return
  [ "$(uname)" = Darwin ] && command -v brew >/dev/null \
    || fail "Install Docker and Docker Compose first (on a Mac, install Homebrew from https://brew.sh)."
  step "Installing Docker tools"
  brew install colima docker docker-compose
  mkdir -p ~/.docker/cli-plugins
  ln -sfn "$(brew --prefix)/opt/docker-compose/bin/docker-compose" ~/.docker/cli-plugins/docker-compose
}

# On a Mac, Docker runs in a virtual machine that needs enough memory for the models.
start_docker() {
  if [ "$(uname)" != Darwin ] || ! command -v colima >/dev/null; then
    docker info >/dev/null 2>&1 || fail "Docker is not running. Start it, then run ./start.sh again."
    return
  fi
  local total want have
  total=$(( $(sysctl -n hw.memsize) / 1073741824 ))
  want=$(( total - 2 < MAX_DOCKER_GB ? total - 2 : MAX_DOCKER_GB ))
  [ "$total" -ge "$MIN_RAM_GB" ] \
    || printf '⚠ This machine has %s GB of RAM; %s GB is recommended. Reviews may be slow or fail.\n' "$total" "$MIN_RAM_GB"
  if colima status >/dev/null 2>&1; then
    have=$(( $(docker info --format '{{.MemTotal}}') / 1073741824 ))
    [ $(( have + 1 )) -ge "$want" ] && return
    step "Restarting Docker with ${want} GB of memory"
    colima stop
  fi
  step "Starting Docker"
  colima start --cpu 4 --memory "$want" --disk 60
}

# Fail early, with a clear message, if an old copy of a portal holds a port.
check_ports() {
  [ -z "$(docker compose ps -q app 2>/dev/null)" ] || return 0
  local port
  for port in 8000 8080 3000 5500 5600 8888; do
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 \
      && fail "Port $port is already in use. Stop that program, then run ./start.sh again (find it with: lsof -i :$port)."
  done
  return 0
}

# Wait until a command succeeds, or fail loudly.
wait_for() {
  local name="$1" waited=0
  shift
  until "$@" >/dev/null 2>&1; do
    [ "$waited" -lt "$WAIT_SECONDS" ] || fail "$name did not start. See the log with: docker compose logs"
    sleep 5
    waited=$(( waited + 5 ))
  done
  echo "✓ $name"
}

install_tools
start_docker
check_ports

step "Creating secrets (only the first time)"
copilot/scripts/create_secrets.sh

step "Starting all services (the first run downloads several GB)"
docker compose up -d --build

step "Waiting for the services"
wait_for "Ollama" docker compose exec -T ollama ollama list
wait_for "Bifrost" curl -sf http://127.0.0.1:8080/
wait_for "Langfuse" curl -sf http://127.0.0.1:3000/api/public/health

step "Checking the models (the first run downloads about 10 GB)"
copilot/scripts/pull_models.sh

wait_for "Contract Copilot" curl -sf http://127.0.0.1:8000/api/health

step "Loading the prompts into Langfuse"
docker compose exec -T app python scripts/push_prompts.py

cat <<'EOF'

✓ Everything is running.

  Contract Copilot  http://localhost:8000
  Langfuse          http://localhost:3000
  Bifrost           http://localhost:8080
  (logins for both: credentials.md)
  Website           http://localhost:5500
  Presentation      http://localhost:5600

  Stop everything:  docker compose down
EOF
