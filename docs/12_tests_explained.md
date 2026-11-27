# Step 5: tests that protect the project

Steps 1 to 4 each came with tests for their own code. Step 5 adds **nine short test files**, one idea each, in `copilot/tests/step5/`.
They test the things that matter most for a legal tool: real contracts, attacks, honesty, and the project's own rules.

## 1. Unit tests, evals, and step 5 tests

| Kind | Checks | Needs the AI? | Speed |
|---|---|---|---|
| **Unit tests** (steps 1 to 4) | Our code, piece by piece | No (a fake model) | Seconds |
| **Evals** (step 4) | How good the AI's answers are, against an answer key | Yes | Minutes |
| **Step 5 tests** | Whole stories: a real PDF, an attack, a lawyer's pause, the project rules | No, except file 9 | Seconds |

> A test that needs no AI gives the **same result every time**. That is why most of step 5 uses a fake model, and only `test_9` uses the real ones.

---

## 2. The nine files

| File | The idea in one line | One example check |
|---|---|---|
| `test_1_real_contracts.py` | Test on the **real sample PDFs**, not made-up text | A real CareWell quote is found on page 6; a made-up one is not |
| `test_2_prompt_injection.py` | Northstar's contract tells any AI to **approve everything**. Python must not be fooled | A fooled model's "Compliant" still becomes "Needs review" |
| `test_3_chat.py` | Chat must be **honest** when the contract has no answer | No clauses found means no model call, and `found` is False |
| `test_4_issues_list.py` | The Issues List: only real problems, **worst first**, the right approver | P1 (weight 5) comes before P8 (weight 2) |
| `test_5_api.py` | The web app **refuses bad input** with a clear error | A `.docx` upload gets 400; an unknown document gets 404 |
| `test_6_human_gate.py` | A review **pauses for a lawyer, survives a restart**, then finishes | A lawyer's override changes CareWell's score from 49 to 41 |
| `test_7_eval_metrics.py` | The **eval maths** is right | Two risky clauses marked OK are counted as 2 |
| `test_8_project_rules.py` | The **golden rules** in CLAUDE.md, checked by a test | No code file is over 120 lines; the app never names a model |
| `test_9_live_models.py` | The **real models** through the real gateway | Bifrost refuses a model that is not on its list |

### The trick most of them use: a fake model

```python
monkeypatch.setattr(gateway, "chat", lambda role, prompt, json_mode=False: fooled_reply)
```

"For this test only, when the app asks the model, give it this answer instead." So we can test **what happens when the model is wrong**, without waiting for a model to be wrong.

### Why test the project rules?

`test_8` turns the rules in `CLAUDE.md` into checks. Rules written in a document get forgotten; a test fails the moment someone breaks one.
It caught a real slip while these branches were being prepared: an example comment in `config.py` named a model, which the rule "the app never names a model" forbids.

---

## 3. Run it (cmd)

From the `copilot` folder:

```
paynestenv\Scripts\activate
cd copilot
pip install -r requirements.txt
python -m pytest tests\step5 -v
```

You should see each test's name with `PASSED`, and the 4 tests in `test_9` as `SKIPPED` (they need the real models).

**Everything, steps 1 to 5:**

```
python -m pytest -q
```

You should see `99 passed, 4 skipped`.

**The live tests** (Ollama, Bifrost and Langfuse running, see doc 3). In a **new** cmd window:

```
set RUN_LIVE_TESTS=1
set SETTINGS_PROFILE=gateway
set BIFROST_URL=http://127.0.0.1:8080/v1
python -m pytest tests\step5\test_9_live_models.py -v
```

You should see `4 passed`. The gateway test needs **Bifrost**: talking straight to Ollama, nothing refuses the unknown model, so that one test fails.

---

## If something goes wrong

| You see | Fix |
|---|---|
| `test_8 ... test_the_app_never_names_a_model` fails | A model name crept into `app/`. Model names belong only in `config/settings.yaml` |
| `test_8 ... over_120_lines` fails | A file grew too long. Split it by job |
| `test_8 ... policy_document_matches` fails | A standard changed but the policy document did not. Run `python scripts\build_policy_doc.py` |
| `test_9` tests fail | The models or Bifrost are not running, or `RUN_LIVE_TESTS` was set in a window with old settings. Open a new window |
