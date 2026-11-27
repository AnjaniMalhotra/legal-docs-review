# Teaching script: step 1, the app code

For the teacher. Every command and expected output below comes from a real run on the teaching laptop (Windows, cmd).

**Before class:**
- Ollama is on: `curl http://localhost:11434` says `Ollama is running`.
- Docker is open, but don't start the containers yet. You start them in step 14.
- Open **one** cmd window in your project folder and run:
  ```
  paynestenv\Scripts\activate
  cd copilot
  ```
  Stay in `copilot` until step 14.

**Already taught, no need to repeat:**
- `docs/1` to `docs/3a`
- `notebooks/00` and `01`
- `infra/langfuse/docker-compose.yml`, `infra/bifrost/config.json`
- `credentials.md`, `scripts/create_secrets.sh`

---

## Part A: How the code is organised

### Step 1: The big picture
**Open:** notebook `01_hello_llm.ipynb`, next to the `copilot` folder in the file explorer.

**Say:** "In notebook 01 everything was in one place. A real app splits it into small files, each with one job."

| Notebook 01 | Now lives in |
|---|---|
| `MODELS = {...}` | `config/settings.yaml` |
| `chat()`, `embed()` | `app/core/gateway.py` |
| Langfuse record | `app/core/tracing.py` |
| `GatewayError` | `app/core/errors.py` |

**Run:** nothing.

### Step 2: `copilot/README.md`
**Open:** `copilot/README.md`

**Say:** "Every folder has a README: what's in this step and where to go next."

**Run:** nothing.

### Step 3: `app/__init__.py`, `app/core/__init__.py` and `tests/__init__.py`
**Open:** `app/__init__.py`. It's empty.

**Say:** "An empty `__init__.py` turns a folder into a Python *package*. That's why we can write `from app.core import gateway`."

**Run:**
```
python -c "import app.core; print('app.core is a package')"
```
**Expect:** `app.core is a package`

### Step 4: `requirements.txt`
**Open:** `requirements.txt`

**Say:** "The packages the app needs: YAML for settings, `python-dotenv` for `.env.local`, the OpenAI client for talking to Bifrost, Langfuse for records, and pytest for tests."

**Run:**
```
pip install -r requirements.txt
```
**Expect:** it installs, or says `Requirement already satisfied`.

### Step 5: `config/settings.yaml`
**Open:** `config/settings.yaml`

**Say:**
- "All settings live here. No model names or numbers are hidden in the code."
- "The code asks for a **role**, like `analyst`. Only this file names the **model**."
- "`temperature: 0` means the same answer every time, as far as possible."

**Run:**
```
python -c "from app.core.config import settings; print(settings()['models']['analyst'])"
```
**Expect:**
```
{'model': 'qwen2.5:7b-instruct', 'temperature': 0, 'max_tokens': 700, 'timeout_s': 600}
```
**Say:** "Python read the YAML file and turned it into a dictionary."

### Step 6: `config/profiles/gateway.yaml`
**Open:** `config/profiles/gateway.yaml`

**Say:** "Bifrost wants the provider in front of the model name, `ollama/...`. This small file changes only that."

**Run:**
```
set SETTINGS_PROFILE=gateway
python -c "from app.core.config import settings; print(settings()['models']['analyst']['model'])"
set SETTINGS_PROFILE=
```
**Expect:** `ollama/qwen2.5:7b-instruct`

**Say:** "Same code, one setting changed, different model name. The last line switches the profile off again."

### Step 7: `app/core/config.py`
**Open:** `app/core/config.py`. Read each In/Out comment aloud.

- **`_merge`:** "Lays the profile on top of the settings. Only the model changed, and the temperature stayed." That's what step 6 just showed.
- **`settings`:** "Reads `settings.yaml`, plus the profile if one is set. `@lru_cache` means it reads the file once and remembers it."
- **`env`:**
  ```
  python -c "from app.core.config import env; print(env('BIFROST_URL', 'not set'))"
  ```
  **Expect:** `not set`. "No variable was set, so we get the default."

### Step 8: `app/core/errors.py`
**Open:** `app/core/errors.py`

**Say:** "One named error, `GatewayError`: a model call failed. A named error tells you **what** broke. We'll see it in step 11."

**Run:** nothing.

### Step 9: `app/core/tracing.py`
**Open:** `app/core/tracing.py`

**Say:**
- "`ENABLED` is only true if Langfuse keys are set."
- "`traced` is our own decorator: with keys it records the call, without keys it does nothing."
- "`flush` sends any waiting records."
- "A missing record must never stop the app."

**Run:**
```
python -c "from app.core import tracing; print('tracing on:', tracing.ENABLED)"
```
**Expect:** `tracing on: False`, because we haven't given it keys yet.

### Step 10: `app/core/gateway.py`
**Open:** `app/core/gateway.py`

**Say:**
- "This is the only door to the models."
- "`chat()`: role in, model looked up in settings, prompt sent, text back."
- "`embed()`: text in, numbers out."
- "`@traced` on top records each call."

**Run, talking straight to Ollama with no Docker:**
```
set BIFROST_URL=http://localhost:11434/v1
python -c "from app.core import gateway; print(gateway.chat('analyst', 'Say hello in five words.'))"
python -c "from app.core import gateway; print(len(gateway.embed(['hello'])[0]), 'numbers')"
```
**Expect:** a short hello (e.g. `Hello, nice to meet.`), then `768 numbers`. The first call takes about 30 seconds while the model loads.

### Step 11: Fail loudly (still `gateway.py`)
**Say:** "What if the server is down? There's no backup model. It must shout."

**Run:**
```
set BIFROST_URL=http://localhost:9999/v1
python -c "from app.core import gateway; gateway.chat('analyst', 'hi')"
```
**Expect:** a long error. Its **last line** is:
```
app.core.errors.GatewayError: Model role 'analyst' failed: Connection error.
```
**Say:** "Always read the last line of an error first. There's our named error from step 8."

**Then clean up. Don't skip this:**
```
set BIFROST_URL=
```

---

## Part B: Through Bifrost and Langfuse

### Step 12: `.env.local.example`
**Open:** `.env.local.example`

**Say:** "This is a sample of `.env.local`. The secrets script already wrote our keys. Now we add three lines to switch the app to Bifrost."

**Run, once only:**
```
echo SETTINGS_PROFILE=gateway>> .env.local
echo BIFROST_URL=http://127.0.0.1:8080/v1>> .env.local
echo LANGFUSE_HOST=http://127.0.0.1:3000>> .env.local
```
**Say:** "No space before `>>`. Running this twice would add the lines twice."

### Step 13: `.gitignore` (in the project folder)
**Open:** `..\.gitignore`

**Say:** "The lines `.env` and `.env.local` are why our secrets never go to GitHub."

**Run:** nothing.

### Step 14: Start Bifrost and Langfuse
**Run:**
```
cd ..\infra\langfuse
docker compose start
docker start paynest-bifrost
cd ..\..\copilot
```
Wait about 1 minute. **Expect:** http://localhost:3000 opens.

### Step 15: `scripts/smoke_test_roles.py`
**Open:** `scripts/smoke_test_roles.py`

**Say:**
- "First it loads `.env.local`, which has the gateway profile, the Bifrost address and the Langfuse keys."
- "Then it sends one test prompt per role and prints a tick or a cross."

**Run:**
```
python scripts\smoke_test_roles.py
```
**Expect:**
```
✓ analyst   ...s  PayNest copilot online.
✓ embed     ...s  768-dim vector
```
**If you see a cross:** open a **new cmd window**, because the old `set` lines may still be active. Run `paynestenv\Scripts\activate`, `cd copilot`, then try again.

### Step 16: The two dashboards
**Open:**
- http://localhost:8080 → **Logs**: both requests, with model, time and status.
- http://localhost:3000 → **Tracing**: `llm.chat` and `llm.embed`.

**Say:** "That's `@traced` from `gateway.py`, working."

---

## Part C: Testing

### Step 17: `tests/conftest.py`
**Open:** `tests/conftest.py`

**Say:** "pytest reads this file first. Today it does one job: it tells Python where the `app` code is. From step 2, shared test helpers called fixtures will live here too."

**Run:** nothing.

### Step 18: `tests/test_gateway.py`
**Open:** `tests/test_gateway.py`

**Say:**
- "`_Fake` is a pretend model. It remembers what we sent and always answers `'  PayNest copilot online.  '`. So tests need **no AI**."
- "`monkeypatch` swaps the real client for the fake one, for this test only."
- "There are 3 tests: the role maps to the model from settings, JSON mode asks for JSON, and a failure raises `GatewayError`."

**Run:**
```
python -m pytest -q
python -m pytest -v
```
**Expect:** `3 passed`. With `-v`, you see the 3 test names, each with `PASSED`.

### Step 19: Break it on purpose
**Open:** `app/core/gateway.py`. In `chat()`, change the last line:
- from `return (resp.choices[0].message.content or "").strip()`
- to `return (resp.choices[0].message.content or "")`

**Run:**
```
python -m pytest -q
```
**Expect:** `1 failed, 2 passed`, with:
```
AssertionError: assert '  PayNest copilot online.  ' == 'PayNest copilot online.'
```
**Say:** "The test caught the extra spaces in seconds."

**Put `.strip()` back** and run `python -m pytest -q` again. **Expect:** `3 passed`.

---

## Part D: The shortcut files

### Step 20: `Makefile`, `scripts/run.sh` and `scripts/pull_models.sh`
**Open:** each one briefly.

**Say:** "These are shortcuts for Mac and Linux. In cmd we type the real commands instead, which is better for learning."

| Shortcut | What we typed instead in cmd |
|---|---|
| `make install` | `pip install -r requirements.txt` (step 4) |
| `make setup` / `pull_models.sh` | `ollama pull ...` (doc 2) |
| `make gateway` | `docker compose start` + `docker start paynest-bifrost` (step 14) |
| `make smoke` / `run.sh` | `python scripts\smoke_test_roles.py` (step 15) |
| `make test` | `python -m pytest -q` (step 18) |

### Step 21: Project files that aren't for class
Mention them in one line each:
- **`README.md`, `SETUP.md`, `STEPS.md`:** project reference.
- **`infra/README.md`:** the Docker setup, written for Mac.
- **`website/`:** PayNest's marketing site, separate from the app.
- **`CLAUDE.md` and `.claude/`:** instructions for the AI coding assistant, not for us.
- **`.gitattributes`:** keeps line endings right on Windows and Mac.

### Step 22: Wrap up
**Say:** "Settings in one file, one door to the models, loud errors, every call recorded, and tests that need no AI. Next: step 2, RAG."

**Give students:** `docs/4_app_core_explained.md` and `docs/5_pytest_and_decorators.md`.

**After class**, if the other project needs Docker:
```
cd ..\infra\langfuse
docker compose stop
docker stop paynest-bifrost
```
