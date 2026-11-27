# The app's first bricks: `copilot/` in step 1

In `notebooks/01_hello_llm.ipynb` we did everything **by hand in one notebook**:
a map of roles to models, a `chat()` function, a Langfuse record, an error when it fails.

The app does **the same things**, but split into small files, so the rest of the app can reuse them.

| Notebook 01 did... | The app does it in... |
|---|---|
| `MODELS = {"analyst": ..., "embed": ...}` | `config/settings.yaml` |
| `chat()` and `embed()` send the prompt to Bifrost | `app/core/gateway.py` |
| A Langfuse record of every call | `app/core/tracing.py` |
| `class GatewayError` when something fails | `app/core/errors.py` |

---

## 1. The flow

```
 your code asks:  gateway.chat("analyst", "Hello")
                        |
                        v
 config.py      reads settings.yaml ------> "analyst" means qwen2.5:7b-instruct
                        |
                        v
 gateway.py     sends the prompt to BIFROST_URL  (Bifrost, port 8080)
                        |                                   |
                        |                                   v
 tracing.py     records "llm.chat" in Langfuse       Bifrost -> Ollama -> the model
                        |
                        v
 the answer comes back as text,
 or errors.py raises GatewayError (no quiet backup model)
```

**The one idea of step 1:** the code asks for a **role** (`analyst`, `embed`). Only `settings.yaml` names a **model**.
To swap a model, you change one line in one file.

---

## 2. What each file does

```
copilot/
|-- config/
|   |-- settings.yaml            all settings in one place
|   `-- profiles/gateway.yaml    "go through Bifrost" switch
|-- app/core/
|   |-- config.py                reads the settings
|   |-- gateway.py               the only door to the models
|   |-- tracing.py               sends records to Langfuse
|   `-- errors.py                named errors
|-- scripts/
|   |-- create_secrets.sh        makes the .env files (doc 3a)
|   |-- smoke_test_roles.py      "is everything alive?" check
|   |-- pull_models.sh           downloads models (same as ollama pull)
|   `-- run.sh                   starts things on Mac/Linux
|-- tests/
|   |-- conftest.py              lets the tests find the app code
|   `-- test_gateway.py          tests for gateway.py
|-- requirements.txt             Python packages the app needs
|-- .env.local.example           a sample of .env.local
`-- Makefile                     shortcuts (Mac/Linux)
```

### `config/settings.yaml`: all settings in one place

```yaml
models:
  analyst:
    model: qwen2.5:7b-instruct
    temperature: 0
    max_tokens: 700
    timeout_s: 600
  embed:
    model: nomic-embed-text
```

- **Rule:** no numbers or model names hidden inside the code. They all live here.
- `temperature: 0` means "give the same answer every time, as far as possible".

### `config/profiles/gateway.yaml`: the Bifrost switch

```yaml
models:
  analyst:
    model: ollama/qwen2.5:7b-instruct
```

- Bifrost wants model names with the provider in front: `ollama/...`.
- When `SETTINGS_PROFILE=gateway` is set, these names **replace** the ones in `settings.yaml`.

### `app/core/config.py`: reads the settings

- `settings()` opens `settings.yaml`, then lays the profile on top if one is set.
- It reads the file **once** and remembers it (`@lru_cache`, see doc 5).
- `env(name, default)` reads one setting from the environment, like `BIFROST_URL`.
- Each function has a comment above it showing **what goes in and what comes out**.
- In later steps this file grows: company rules (step 3), prompt files and upload folders (step 2).

### `app/core/gateway.py`: the only door to the models

- `chat(role, prompt)`: looks up the role, sends the prompt to Bifrost, returns the text.
- `embed(texts)`: turns texts into lists of numbers.
- If anything goes wrong, it raises `GatewayError`. **There is no backup model.** A legal tool must never quietly switch to a weaker model.
- No other file in the app talks to the models. Everything goes through here.

### `app/core/tracing.py`: the Langfuse recorder

- `@traced("llm.chat")` on top of `chat()` means "record every call in Langfuse as `llm.chat`".
- **No Langfuse keys? Then it does nothing**, and the app still works. That is how the unit tests run without Langfuse.
- If Langfuse breaks, the app keeps going. A missing record must never stop a contract review.

### `app/core/errors.py`: named errors

Step 1 has one: `GatewayError`, meaning **a model call failed**.

A named error says **what** went wrong. A plain `Exception` says nothing.
More join in later steps, like `NotFoundError` (an unknown document, step 2).

### `scripts/smoke_test_roles.py`: "is everything alive?"

Sends **one test prompt per role** and prints a tick or a cross. Each call also shows up in Bifrost and Langfuse.

### `tests/`: checks the code without any AI

See doc 5.

### The rest

| File | What it is | In class |
|---|---|---|
| `requirements.txt` | the Python packages the app needs | install it (below) |
| `.env.local.example` | a sample of what `.env.local` looks like | show it |
| `pull_models.sh` | downloads the models | skip, same as `ollama pull` |
| `run.sh`, `Makefile` | shortcuts for Mac and Linux | skip, they do not work in cmd |

---

## 3. Run it (cmd)

Start Ollama, Langfuse and Bifrost first (docs 2 and 3).

**Step 1.** Tell the app to go through Bifrost. From your project folder, add three lines to `copilot\.env.local`:

```
echo SETTINGS_PROFILE=gateway>> copilot\.env.local
echo BIFROST_URL=http://127.0.0.1:8080/v1>> copilot\.env.local
echo LANGFUSE_HOST=http://127.0.0.1:3000>> copilot\.env.local
```

> Type `>>` straight after the text, with **no space**. A space would end up inside the value.
> Do this **once**. Running it twice adds the lines twice.

**Step 2.** Install the app's packages:

```
paynestenv\Scripts\activate
pip install -r copilot\requirements.txt
```

**Step 3.** Run the unit tests (no models needed):

```
cd copilot
python -m pytest -q
```

You should see `3 passed`.

**Step 4.** Run the smoke test (needs Ollama, Bifrost and Langfuse):

```
python scripts\smoke_test_roles.py
```

You should see:

```
✓ analyst   30.4s  PayNest copilot online.
✓ embed      1.7s  768-dim vector
```

The first call is slow (the model is loading). Now open Langfuse and see `llm.chat` and `llm.embed`, and open Bifrost's Logs and see both requests.

---

## If something goes wrong

| You see | Fix |
|---|---|
| `502 ... connection refused` | Ollama is off. Wake it (doc 2) |
| `Connection error` | Bifrost is off: `docker start paynest-bifrost` |
| `out of memory` | Close other programs (Chrome, notes apps), then try again |
| `No module named 'yaml'` | Step 2 was skipped: `pip install -r copilot\requirements.txt` |
| Nothing in Langfuse | Step 1 was skipped, or the keys do not match this Langfuse |

**Next:** `5_pytest_and_decorators.md`, how the tests work and what the `@` lines mean.
