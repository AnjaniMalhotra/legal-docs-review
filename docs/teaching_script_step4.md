# Teaching script: step 4, evals

For the teacher. Every command and expected output below comes from a real run on the teaching laptop (Windows, cmd).

**Before class:**
- Ollama is on, with all three models downloaded: `ollama list` shows `qwen2.5:7b-instruct`, `nomic-embed-text` and `llama3.1:8b`.
- Close heavy programs: the evals load two big models, one after the other.
- Open **one** cmd window in your project folder and run:
  ```
  paynestenv\Scripts\activate
  cd copilot
  pip install -r requirements.txt
  ```

**The story for the class:** "Steps 1 to 3 built the app. 'It looked right when I tried it' is not proof. Now we measure it, with numbers, on contracts whose right answers we already know."

---

## Part A: The answer key

### Step 1: Why measure (no commands)
**Open:** `docs/11_evals_explained.md`, sections 1 and 3.

**Say:** "A model can be right on one contract and wrong on the next. So we keep an answer key and mark the app against it, every time we change something. The model never sees the key."

### Step 2: `evals/golden_set.json`
**Open:** `evals/golden_set.json`

**Say:** "5 sample contracts, each with the right status for all 10 rules and the expected score, plus 10 chat questions with the right page, or 'Not found'."

**Run:**
```
python -c "import json; g=json.load(open('evals/golden_set.json', encoding='utf-8')); print(len(g['contracts']), 'contracts,', len(g['questions']), 'questions'); c=g['contracts'][1]; print(c['id'], c['expected_score'], c['expected_band'], c['labels']['P5'])"
```
**Expect:**
```
5 contracts, 10 questions
northstar 43 Medium Conflicting
```
**Say:** "The same 43 Medium as the solved Northstar copy, and P5 is Conflicting: the 'audit at any time' clause."

---

## Part B: The metrics

### Step 3: `evals/metrics.py`, the plain-Python part
**Open:** `evals/metrics.py`, down to `check_targets`.

**Say:** "Accuracy is the share we got right. `compliant_on_risky` counts the one mistake we can never allow: calling a risky clause OK."

**Run:**
```
python -c "from evals.metrics import accuracy, compliant_on_risky; pairs=[('Conflicting','Conflicting'), ('Partial','Compliant'), ('Missing','Compliant')]; print('accuracy', round(accuracy(pairs), 2), '| risky marked OK', compliant_on_risky(pairs))"
```
**Expect:** `accuracy 0.33 | risky marked OK 1`

**Say:** "Three rules: one right, two wrong. The Partial-called-Compliant mistake is bad. The Missing-called-Compliant one is the **release blocker**: a lawyer might never see it."

**Run the citation check:**
```
python -c "from evals.metrics import citation_hit; print(citation_hit('Notify within 12 hours [p.5, 9.3 SECURITY INCIDENTS]', [5]), citation_hit('Notify within 12 hours [p.7, 15.1 LIABILITY]', [5]))"
```
**Expect:** `True False`. **Say:** "Right page cited, or not."

### Step 4: Targets in `config/settings.yaml`
**Open:** `config/settings.yaml`, the `evals:` section.

**Say:** "The targets live in settings, not in code: 80% rules right, 90% right pages, 100% honest 'Not found', 100% real quotes, 85% faithful answers."

**Run:**
```
python -c "from evals.metrics import check_targets; print(check_targets({'classification_accuracy': 0.9}, {'classification_accuracy': 0.8})); print(check_targets({'classification_accuracy': 0.9}, {'classification_accuracy': 0.95}))"
```
**Expect:** the first line ends `'met': True`, the second `'met': False`. **Say:** "Same result, stricter target, and now it fails. Raising a target is how a team asks for better quality."

---

## Part C: The judge and Ragas

### Step 5: The judge model
**Open:** `config/settings.yaml`, the `judge:` model, then `config/profiles/gateway.yaml` and `..\infra\bifrost\config.json` (the allowlist).

**Say:** "Ragas needs a model to grade the answers: the **judge**, llama3.1 8B. It's a different family from the analyst, so it doesn't just agree with itself. It runs on this laptop, and Bifrost's allowlist now has 3 models."

**Run:**
```
python -c "from app.core.config import settings; print(settings()['models']['judge']['model'], '| targets:', list(settings()['evals']['targets']))"
```
**Expect:** `llama3.1:8b | targets: ['faithfulness', 'classification_accuracy', 'citation_accuracy', 'not_found_honesty', 'grounding_pass_rate']`

### Step 6: `evals/metrics.py`, the Ragas part
**Open:** `evals/metrics.py`, from `_judge` down.

**Say:**
- "`_judge` points Ragas at **our** judge model through Bifrost. Nothing goes to the cloud, and `RAGAS_DO_NOT_TRACK` turns off Ragas' own reporting."
- "Faithfulness asks: does the answer only say what the clauses say? That's how a made-up answer gets caught."

### Step 7: What grew in the app
**Open:** `app/core/tracing.py` (`score`), then `app/rag/answerer.py` (`contexts`).

**Say:** "Two small additions for the evals: each answer now also returns the clauses it used, so Ragas can check it, and each Ragas score is written onto that answer's Langfuse record."

---

## Part D: Running the evals

### Step 8: `evals/run_evals.py`
**Open:** `evals/run_evals.py`

**Say:**
- "For each contract it uploads it, runs the **same** review the portal runs, and asks its questions."
- "Then it unloads the analyst (`ollama stop`) and grades with the judge, because one model at a time fits in memory."
- "Finally it checks every target and the release blocker."

### Step 9: One contract, without Ragas
**Run:**
```
set BIFROST_URL=http://localhost:11434/v1
python -m evals.run_evals --contract northstar --skip-ragas
```
**Expect** (about 3 minutes):
```
northstar     43 Medium   (expected 43 Medium)  rules 9/10  seconds {'review': 148, 'chat': 20, 'ragas': 0}
– faithfulness               target 0.85   actual None
✅ classification_accuracy    target 0.8    actual 0.9
✅ citation_accuracy          target 0.9    actual 1.0
– not_found_honesty          target 1.0    actual None
✅ grounding_pass_rate        target 1.0    actual 1.0
✅ compliant_on_risky = 0
```
**Say:**
- "9 of 10 rules match the key. The one that doesn't is P7: the app says 'Needs a lawyer's check' where the key says Not acceptable. That's the safe direction, because a lawyer still sees it."
- "A dash means 'not measured in this run': no Ragas, and Northstar has no 'Not found' question."

### Step 10: With Ragas
**Run:**
```
python -m evals.run_evals --contract northstar
```
**Expect** (about 8 minutes: the review, then the judge model loads and grades 2 answers with 4 metrics each):
```
northstar     43 Medium   (expected 43 Medium)  rules 9/10  seconds {'review': 141, 'chat': 18, 'ragas': 320}
✅ faithfulness               target 0.85   actual 1.0
✅ classification_accuracy    target 0.8    actual 0.9
✅ citation_accuracy          target 0.9    actual 1.0
– not_found_honesty          target 1.0    actual None
✅ grounding_pass_rate        target 1.0    actual 1.0
✅ compliant_on_risky = 0
```
**Say:** "Faithfulness 1.0: both answers only said what the clauses say. The judge also gave answer relevancy around 0.6 to 0.7: the answers are correct but say a bit more than the question asked. That one has no target; it's a hint for improving the prompt."

### Step 11: The saved results
**Open:** `copilot\data\evals\latest.json` in VS Code.

**Say:** "Everything from the last run is saved here: every rule's expected and actual status, every chat answer with its page, the Ragas scores, the mistakes table (`confusion`) and the release blocker."

> On Mac, `scripts/run.sh` also loads the Langfuse keys, so each answer's Ragas scores appear on its Langfuse record. `run_evals` does not read `.env.local` by itself, so in cmd the scores are only in this file.

---

## Part E: Wrap up

### Step 12: `notebooks/04_evals.ipynb` and `presentation/`
**Open:** the notebook (it needs Bifrost running), then `..\presentation\index.html` in the browser.

**Say:** "The notebook shows the same steps one cell at a time. The presentation is the whole course in slides."

### Step 13: The tests still pass
**Run:**
```
python -m pytest -q
```
**Expect:** `64 passed`. **Say:** "Unit tests check our code with no AI. Evals check the AI's answers. We need both."

### Step 14: Wrap up
**Say:** "We don't trust a demo; we trust numbers on an answer key the model never saw. And the one mistake that matters most, calling a risky clause OK, must stay at zero. Next: step 5, more tests."

**Give students:** `docs/11_evals_explained.md`, and `docs/10_tech_stack.md` for every tool and file.
