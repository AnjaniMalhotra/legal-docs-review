# Step 3: the review agent

In step 2 the app could answer **questions** about a contract. Now it **reviews the whole contract** against PayNest's 10 rules, gives a **risk score**, and **stops for a lawyer** when something is risky.

## 1. The one big rule: the model reads, Python decides

| The model (AI) does | Python does |
|---|---|
| Reads the clauses for one rule | Checks the quote really is in the PDF |
| Picks a status: Compliant, Partial, Conflicting, Not found, N/A | Checks the numbers (days, hours, %) |
| Copies a quote as evidence | Checks for walk-away words ("unlimited") |
| | Works out the score and the band |
| | Decides if a lawyer must approve |

**Why?** A model can make mistakes or be tricked. Python cannot be talked into a different answer. The model's job is small, and everything after it can be checked and tested.

---

## 2. The flow (a LangGraph graph)

```
 classify  -->  score  -->  human_gate  -->  finalize
 (the AI,       (Python:     (pause for a     (score again with the lawyer's
  10 rules)      score,       lawyer, if       decisions; build the report
                 band,        risky)           and the Issues List)
                 gate)
```

For **each** of the 10 rules, `classify` does this:

```
 find the clauses for the rule (retriever.for_rule)
   -> ask the analyst, strict JSON (classifier)
   -> "Not found"? Missing or Silent (OK), from the rule's if_silent setting
   -> red-flag words?        -> stricter: Needs review   (checks.red_flag)
   -> quote not in the PDF?  -> Needs review             (grounding)
   -> number in a worse band? -> stricter                (checks.numbers)
```

**The safety checks can only make a finding stricter, never milder.**

### Why LangGraph?

The review must **pause** and wait for a lawyer, maybe for days. LangGraph gives us:

- **`interrupt`**: stop the graph in the middle and wait.
- **A checkpointer (SQLite)**: the paused review is saved on disk. Close the browser, come back later, and carry on.
- **`Command(resume=...)`**: start again from the pause, with the lawyer's decisions.

---

## 3. The company rules

| File | What it is |
|---|---|
| `config/standards/P01...P10.yaml` | One file per rule: what we want, can accept, never accept, the weight, `if_silent`, red-flag words, the number check |
| `policies/PayNest_Contracting_Standards.md` | The same rules as a readable document, **made from the YAML** by `scripts/build_policy_doc.py`. Never edit it by hand |

The standards sheet students got in class (`example_legal_contracts/PayNest_Contracting_Standards.pdf`) explains the same 10 rules in simple words.

---

## 4. What each new file does

```
copilot/
|-- app/
|   |-- graph/
|   |   |-- nodes.py            the 4 steps of the graph
|   |   `-- policy_service.py   builds the graph, starts and resumes reviews
|   |-- policy/
|   |   |-- classifier.py       asks the model about one rule (strict JSON, retry once)
|   |   |-- grounding.py        is the quote really in the PDF?
|   |   |-- checks.py           red-flag words, and the number check
|   |   |-- scoring.py          the score, the band, the safety rule, the gate
|   |   |-- review.py           the lawyer's decisions, and the audit trail
|   |   `-- report.py           the final report and the Issues List
|   `-- api/routes_policy.py    the web addresses for reviews
|-- config/standards/          the 10 rules
|-- prompts/
|   |-- classify_rule.md        the prompt for one rule
|   `-- classify_retry.md       "your reply was rejected, try again"
|-- scripts/build_policy_doc.py writes the readable policy document
|-- evals/golden_set.json       the answer key: the expected result for 5 sample contracts
|-- web/                        the portal: HTML, CSS and JavaScript, no frameworks
`-- tests/                      6 new test files
```

| File | Its job, in one line |
|---|---|
| `classifier.py` | Fills the `classify_rule` prompt with the rule and its clauses. The reply must be JSON with one allowed status. A bad reply gets **one** retry, telling the model what was wrong |
| `grounding.py` | Looks for the quote, word for word, in the PDF text. Small differences (line breaks, curly quotes) are ignored; the words must match. Not found = `Needs review` |
| `checks.py` | **Red flag:** a walk-away word in the clauses, but the model did not say Conflicting, gives `Needs review`. **Numbers:** "60 days" read from the quote, compared with the rule's bands |
| `scoring.py` | Score = risk points / weights x 100. Band: Low, Medium, High, Critical. **Safety rule:** a key rule (P1, P2, P3) that is Missing or Conflicting makes it at least High |
| `nodes.py` | The 4 steps. Only `classify` calls the model |
| `policy_service.py` | Builds the graph with the SQLite checkpointer, and starts and resumes a review |
| `review.py` | Checks the lawyer's decisions (approve, override with a note) and records who decided what, and when |
| `report.py` | The final report, and the **Issues List**: each problem with the client's wording, PayNest's position, the change to ask for, and who must approve |
| `routes_policy.py` | `GET /api/policy/standards`, `POST /api/policy/reviews`, `POST /api/policy/reviews/{id}/decisions` |
| `web/` | The portal at http://127.0.0.1:8000: Summary, Agreement, Review, Issues List, Audit trail, Standards |

### What grew in the earlier files

| File | New in step 3 |
|---|---|
| `config.py` | `standards()` and `rule()`, with In/Out comments |
| `errors.py` | `DecisionError`: a lawyer's decision is missing or invalid (web code 422) |
| `retriever.py` | `for_rule()`: find the clauses for one rule, boosted by its `look_for` words |
| `doc_store.py` | `save_report()`: keep each final review as the audit record |
| `settings.yaml` | `classifier:`, `scoring:` (gap factors, bands, safety rule) and `gate:` (when to stop for a lawyer) |
| `main.py` | Serves the web portal, and the health check shows the standards version |
| `tests/conftest.py` | `golden` (the answer key) and `findings_from_labels` |

---

## 5. Run it (cmd)

Ollama must be on. From the `copilot` folder:

```
paynestenv\Scripts\activate
cd copilot
pip install -r requirements.txt
set BIFROST_URL=http://localhost:11434/v1
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000**:

1. Fill in **Counterparty**, **Matter reference** and **Assigned counsel**, then upload `sample_contracts\02_northstar_bank.pdf`.
2. Click **Check against PayNest rules**. It takes about 2 to 3 minutes: 10 rules, one model call each.
3. Northstar scores **43, Medium**, and stops for a lawyer: P5 is Not acceptable, and P7 needs a lawyer's check.
4. In the **Review** tab, approve or override each flagged rule (an override needs a note), then click **Save decisions and approve**.
5. Open the **Issues List** and the **Audit trail**.

**The tests** (no models needed):

```
python -m pytest -q
```

You should see `64 passed`. Some of them check that the 5 sample contracts still score **49 / 43 / 3 / 29 / 18**.

---

## If something goes wrong

| You see | Fix |
|---|---|
| The review takes very long | The first rule loads the model. Close other programs (memory). About 2 to 3 minutes is normal |
| `422 decisions missing for: P5` | Every flagged rule needs a decision before you submit |
| `422 override needs a note` | An override must say why |
| `422 This review is already final.` | It was already submitted. Start a new review |
| Scores in the tests changed | Someone changed a weight, a gap factor or a band. That is what those tests are for |

**Next:** `notebooks/03_review_agent.ipynb` shows the same steps one cell at a time.
