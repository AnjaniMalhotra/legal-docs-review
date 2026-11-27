# Step 4: evals, proving it works

Steps 1 to 3 built the app. Now we **measure how good it really is**, with numbers, on contracts whose right answers we already know.

## 1. Why measure?

"It looked right when I tried it" is not proof. A model can be right on one contract and wrong on the next.
So we keep an **answer key** and check the app against it every time something changes.

> The model never sees the answer key. It is only used to mark the app's work, like a teacher's marking scheme.

---

## 2. The answer key (`evals/golden_set.json`)

| What | How many | Example |
|---|---|---|
| Sample contracts, with the right status for each of the 10 rules and the expected score | 5 | Northstar: 43, Medium, P5 Conflicting |
| Chat questions, with the expected answer and the page it is on, or "Not found" | 10 | Northstar: "When can the bank audit us?" → page 5. BrightRetail: "Which court handles disputes?" → Not found |

---

## 3. What we measure

| Metric | Question it answers | Target |
|---|---|---|
| **Classification accuracy** | Did the review give each rule the right status? | 80% |
| **Citation accuracy** | Does the chat answer cite the right page? | 90% |
| **Not-found honesty** | When the answer is not in the contract, does it say "Not found"? | 100% |
| **Grounding pass rate** | Is every quote really in the PDF? | 100% |
| **Faithfulness** (Ragas) | Does the chat answer only say what the clauses say? | 85% |
| **Risky marked OK** | Did it ever call a Missing or Conflicting rule "Compliant"? | **must be 0** |

The last one is the **release blocker**. Calling a dangerous clause "OK" is the one mistake that could make PayNest sign a bad contract. Any other mistake still goes to a lawyer; this one might not.

The targets live in `config/settings.yaml` under `evals: targets:`, not in the code.

---

## 4. The judge and Ragas

**Ragas** is a library that grades answers. It needs a model to do the grading: the **judge**.

| Role | Model | Why |
|---|---|---|
| analyst | qwen2.5 7B | writes the answers |
| **judge** | **llama3.1 8B** | grades them. A **different family** from the analyst, so it does not just agree with itself |

The judge also runs **on this laptop**, through Bifrost. Ragas' own telemetry is switched off (`RAGAS_DO_NOT_TRACK`), so nothing leaves the machine. Each Ragas score is also written onto the answer's record in Langfuse (`tracing.score()`).

Only one model fits in memory at a time, so the evals unload the analyst before the judge starts (`ollama stop`).

---

## 5. What each new file does

```
copilot/
|-- evals/
|   |-- golden_set.json      the answer key
|   |-- run_evals.py         runs the real app on each contract and prints the results
|   `-- metrics.py           the maths: accuracy, citations, targets, Ragas
notebooks/04_evals.ipynb     the same, one cell at a time
presentation/                the teaching slides (open presentation/index.html)
```

| File | Its job, in one line |
|---|---|
| `run_evals.py` | For each contract: upload it, run the **same** review the portal runs, ask its questions, grade with Ragas, then check the targets |
| `metrics.py` | Plain-Python maths (accuracy, mistakes table, citations, the release blocker) plus Ragas for the chat answers |

### What grew in the earlier files

| File | New in step 4 |
|---|---|
| `settings.yaml` | The `judge` model, and `evals:` (Ragas settings and the targets) |
| `config/profiles/gateway.yaml` | The judge's Bifrost name, `ollama/llama3.1:8b` |
| `tracing.py` | `score()`: write a Ragas score onto a Langfuse record |
| `answerer.py` | Each answer also returns its `contexts` (the clauses it used), so Ragas can check it |
| `requirements.txt` | `ragas`, `langchain-openai`, `langchain-community` (only for the evals) |
| `infra/bifrost/config.json` | The judge model is added to the allowlist |

---

## 6. Run it (cmd)

Ollama must be on, with all three models downloaded (`2_ollama_basics.md`, step 4a). From the `copilot` folder:

```
paynestenv\Scripts\activate
cd copilot
pip install -r requirements.txt
set BIFROST_URL=http://localhost:11434/v1
```

**One contract, without Ragas (about 3 minutes):**

```
python -m evals.run_evals --contract northstar --skip-ragas
```

You should see:

```
northstar     43 Medium   (expected 43 Medium)  rules 9/10  seconds {'review': 148, 'chat': 20, 'ragas': 0}
✅ classification_accuracy    target 0.8    actual 0.9
✅ citation_accuracy          target 0.9    actual 1.0
✅ grounding_pass_rate        target 1.0    actual 1.0
✅ compliant_on_risky = 0
```

**With Ragas** (slower: the judge model has to load): leave out `--skip-ragas`.
**All 5 contracts:** leave out `--contract northstar`. Plan for 15 to 30 minutes.

The full result is saved in `copilot/data/evals/latest.json`.

---

## If something goes wrong

| You see | Fix |
|---|---|
| `out of memory` | Close other programs. The evals load two big models, one after the other |
| `faithfulness ... actual None` | That run used `--skip-ragas`, or Ragas timed out. Run again without the flag |
| A target shows ❌ | That is the point: something got worse. Look at which rules or questions changed |
| `compliant_on_risky` is not 0 | **Stop.** A risky clause was marked OK. Do not release until it is fixed |

**Next:** `notebooks/04_evals.ipynb` shows the same steps one cell at a time.
