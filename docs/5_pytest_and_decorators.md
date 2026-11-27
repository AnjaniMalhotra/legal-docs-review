# Unit tests, pytest and decorators

## Part 1. Unit tests

### What is a unit test?

A small piece of code that **checks another piece of code**, automatically.

```
 the code:   gateway.chat("analyst", "hello")
 the test:   did it send the right model? did it return the text? did it fail loudly?
```

### Why bother?

- **Fast.** Our 3 tests run in about 2 seconds.
- **No AI needed.** We swap the real model for a fake one, so tests run anywhere, even with Wi-Fi off.
- **Catches mistakes early.** Change something, run the tests. If one fails, you broke something.
- **Safe changes.** In a legal tool, a quiet mistake (like using the wrong model) is dangerous. Tests guard against it.

> AI answers change from run to run. So we **never** test the AI's words.
> We test **our own code**: did it ask for the right model, and does it fail loudly?

---

## Part 2. pytest

`pytest` is the tool that finds and runs tests.

```
cd copilot
python -m pytest -q
```

```
...                                                     [100%]
3 passed in 2.58s
```

Each `.` is one test that passed. An `F` would be a failure, with the reason printed below.

### How pytest finds tests

| Rule | Example |
|---|---|
| Files named `test_*.py` | `tests/test_gateway.py` |
| Functions named `test_*` | `def test_json_mode_asks_for_a_json_object():` |
| `assert` checks something is true | `assert fake.sent["model"] == "qwen2.5:7b-instruct"` |

If an `assert` is false, the test fails.

### Useful commands

| Command | What it does |
|---|---|
| `python -m pytest -q` | run all tests, short output |
| `python -m pytest -v` | show the name of every test |
| `python -m pytest tests\test_gateway.py` | run one file |
| `python -m pytest -k json` | run only tests with `json` in the name |

---

## Part 3. Our 3 tests, in plain words

All three are in `tests/test_gateway.py`. They use a **fake model client** (`_Fake`), which:

- remembers what we sent it,
- always answers `"  PayNest copilot online.  "`,
- or, if asked, pretends the server is down.

| Test | What it checks | Why it matters |
|---|---|---|
| `test_role_is_mapped_to_the_model_in_settings` | Asking for `analyst` sends the model and temperature from `settings.yaml`, and the answer comes back trimmed | Code asks for a role; only settings name the model |
| `test_json_mode_asks_for_a_json_object` | `json_mode=True` asks the model for JSON | Later, the review needs answers Python can read |
| `test_a_failure_raises_gateway_error_instead_of_falling_back` | When the server is down, we get `GatewayError` | No quiet backup model, ever |

### How the fake gets in: `monkeypatch`

```python
monkeypatch.setattr(gateway, "_client", lambda base_url: fake)
```

In plain words: **"for this test only, when `gateway` asks for a client, hand it our fake one."**
After the test, the real one comes back by itself.

### Checking that something fails: `pytest.raises`

```python
with pytest.raises(GatewayError, match="analyst"):
    gateway.chat("analyst", "hello")
```

In plain words: **"this must raise `GatewayError`, and the message must mention `analyst`."**
If it does not fail, the test fails.

---

## Part 4. Decorators: the `@` lines

### What is a decorator?

A line starting with `@` **on top of a function**. It **wraps the function to add something extra**, without changing the function's own code.

Think of it as a **gift wrap**: the gift (the function) stays the same, the wrap adds something on the outside.

```python
def shout(fn):                 # a decorator is just a function...
    def wrapper():
        return fn().upper()    # ...that adds something extra
    return wrapper

@shout
def hello():
    return "hello"

hello()   # -> "HELLO"
```

`@shout` on top of `hello` is the same as writing `hello = shout(hello)`.

### Every decorator we use

| Decorator | Where | What it adds | From step |
|---|---|---|---|
| `@lru_cache` | `config.py` (`settings`), `gateway.py` (`_client`) | **Remember the answer.** Run once, then reuse the result | 1 |
| `@traced("llm.chat")` | `gateway.py` (`chat`, `embed`) | **Record every call in Langfuse.** Does nothing if there are no keys | 1 |
| `@pytest.fixture` | `tests/` | **Prepare something for tests** (see below) | 2 |
| `@router.get(...)`, `@router.post(...)` | `app/api/` | **Turn a function into a web address**, like `POST /api/documents` | 2 |
| `@app.get("/api/health")` | `app/main.py` | The same, for the app's health check | 2 |
| `@pytest.mark.parametrize(...)` | `tests/` | **Run one test many times** with different inputs | 3 |

### `@lru_cache`: remember the answer

```python
@lru_cache
def settings() -> dict:
    ...  # opens and reads settings.yaml
```

- The **first** call reads the file.
- Every **later** call gets the saved result straight away, without opening the file again.

### `@traced`: record in Langfuse

```python
@traced("llm.chat")
def chat(role, prompt, json_mode=False):
    ...
```

- `traced` is **our own** decorator, in `tracing.py`.
- With Langfuse keys, it uses Langfuse's `observe`, which records the call: inputs, output, time.
- Without keys, it returns the function **unchanged**, so tests and offline runs still work.

In the notebook we did the same thing by hand, with `with langfuse.start_as_current_observation(...)`.

### `@pytest.fixture`: prepare things for tests

A fixture is **something a test needs, made ready before the test runs**. We write our own from step 2. Here is the idea:

```python
@pytest.fixture
def fake_contract():
    return {"page": 3, "text": "Availability of 99.5%."}

def test_reads_the_page(fake_contract):      # naming it is enough: pytest hands it over
    assert fake_contract["page"] == 3
```

- A test gets a fixture **just by naming it** as an input.
- Add `autouse=True` and **every** test gets it automatically.

**You already used one in step 1:** `monkeypatch` is a fixture that **comes with pytest**.
Our tests name it (`def test_...(monkeypatch):`) and pytest hands it over. So does `tmp_path`, which gives a test a fresh empty folder.

> `tests/conftest.py` is where shared fixtures live. In step 1 it only does one job: it lets the tests find the `app` code.

---

## Quick recap

| Word | One line |
|---|---|
| Unit test | Code that checks code, fast, with no AI |
| pytest | The tool that finds and runs the tests |
| `assert` | "This must be true" |
| Fake | A pretend model, so tests need no AI |
| `monkeypatch` | Swap something for one test only |
| `pytest.raises` | "This must fail with this error" |
| Decorator (`@`) | Wraps a function to add something extra |
| Fixture | Something made ready before a test |
