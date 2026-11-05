# Glossary

> **Living document.** Plain-English meanings of every term used in this project. Keep entries **alphabetical** within each section. Add new words as you meet them.
>
> Format: **Term** · *(abbreviation)* · short meaning.

Sections: [Project terms](#project-terms) · [Legal and contract terms](#legal-and-contract-terms) · [HR and payroll terms](#hr-and-payroll-terms) · [AI and ML terms](#ai-and-ml-terms) · [Infrastructure and observability terms](#infrastructure-and-observability-terms)

---

## Project terms

- **Applicable weight**: The sum of weights for rules that are not N/A. The denominator of the risk formula.
- **Band**: The risk level from the score: Low (0–20), Medium (21–45), High (46–70), Critical (71–100).
- **Client standards**: PayNest's internal rulebook (10 rules) for what it can and cannot promise in client contracts.
- **Critical floor**: The rule that if P1, P2 or P3 is Missing or Conflicting, the band is at least High.
- **Critical rule**: A standard with weight 5 (P1 Liability, P2 Indemnity, P3 Breach notice).
- **Evidence quote**: The exact sentence from the contract that supports a finding. Must be verbatim.
- **Fallback position**: What PayNest can accept after negotiation → status Partial.
- **Finding**: The tool's result for one rule: status, quote, page, reason.
- **Gap factor** *(g)*: How far a status is from acceptable: 0, 0.5 or 1.
- **Golden set**: Hand-made questions and labels with known correct answers, used to test the system.
- **Display labels**: Plain-English names shown in the app for the internal statuses: OK (Compliant), Acceptable (Partial), Not acceptable (Conflicting), Missing, Not mentioned (fine) (Silent OK), Doesn't apply (N/A), Needs a lawyer's check (Needs review). Positions are shown as Ideal / Can accept / Never accept. The outgoing Issues List keeps formal legal terms (Fallback position, Non-standard).
- **Grounding guard**: A deterministic check that the evidence quote really exists in the PDF; if not, the finding becomes Needs review.
- **Hybrid retrieval**: Semantic search followed by re-ranking on the rule's `look_for` keywords, so red-flag drafting rises above boilerplate.
- **Human gate**: The point where the workflow pauses for a reviewer to approve, override or add a note.
- **If silent**: A per-rule standards setting saying whether a contract *not mentioning* a topic is risky (→ Missing) or fine (→ Silent OK).
- **Label sheet**: Per-contract table of true status, page and quote for every rule.
- **Missing**: Status when a rule's topic isn't in the contract **and** that silence is risky (e.g. no liability cap).
- **Needs review**: A status set by the system (never the LLM) when an evidence quote can't be verified.
- **Not found**: What the LLM reports when no clause covers a rule; Python then turns it into Missing or Silent (OK).
- **PayNest Technologies**: Our fictional private payroll provider in Bengaluru; runs everything on its own servers.
- **Planted clause**: A risky or tricky clause we deliberately write into a synthetic contract to test the tool.
- **Policy check**: The one-click run that checks a contract against all 10 rules and scores it.
- **Preferred position**: What PayNest wants → status Compliant.
- **Pushback**: The counter-proposal PayNest sends the client for a clause it can't accept as written.
- **Risk score**: A number from 0 to 100 computed in Python from weights and gap factors.
- **Role** (model role): A job name the app uses instead of a model name: `analyst`, `judge`, `embed`.
- **Silent (OK)**: Status when a rule's topic isn't in the contract **and** that silence is fine for PayNest (e.g. no audit clause = no audit duty). Gap 0.
- **Red-flag tripwire**: Deterministic check that escalates a provision to Needs a lawyer's check when walk-away phrases (e.g. "unlimited", "immediately") appear but the model did not mark it Not acceptable. Can only escalate, never clear.
- **Status**: Compliant, Partial, Conflicting, Missing, Silent (OK), N/A or Needs review.
- **Walk-away position**: What PayNest never accepts without General Counsel sign-off → status Conflicting.
- **Weight** *(w)*: How important a rule is, from 1 to 5.

## Legal and contract terms

- **Approval authority**: The person who may accept a deviation from the standards, e.g. Legal Counsel for a fallback, General Counsel and CFO for a walk-away.
- **Counsel approval**: Sign-off by the assigned in-house lawyer on escalated provisions before an agreement proceeds.
- **Counterparty**: The other party to an agreement; here, the client sending PayNest its draft.
- **Execution version**: The final agreed text ready for signature, as opposed to a draft for negotiation.
- **Issues List**: The negotiation document sent to the counterparty: clause, counterparty drafting, proposed amendment. Excludes internal approvals.
- **Mandatory escalation**: A critical provision (P1–P3) that, if Missing or Non-standard, raises the risk rating to at least High.
- **Matter**: A legal file opened for one piece of work, identified by a matter reference (e.g. MAT-2026-0142).
- **Model clause**: PayNest's preferred wording for a provision, proposed during negotiation.
- **Negotiation standards**: An in-house legal team's standards for each provision: preferred, fallback and walk-away positions, approval authority, model clause.
- **Red line**: Another name for a walk-away position.
- **Without prejudice**: Marking that a negotiation document cannot be used as an admission or binding offer.

- **Aggregate liability**: The total maximum a party pays across all claims. *P1*
- **Arbitration**: Settling a dispute privately through an arbitrator instead of a court. *P10*
- **Arbitration seat**: The city whose courts oversee an arbitration (e.g. Bengaluru, Mumbai). *P10*
- **Audit rights**: The client's right to inspect PayNest's premises, systems or records. *P5*
- **Boilerplate**: Standard clauses found in most contracts (notices, force majeure, assignment).
- **Clause**: A numbered section of a contract (e.g. 14.1 Limitation of Liability).
- **Client paper**: A contract written by the client, on the client's template, usually in the client's favour.
- **Confidentiality**: The duty to keep information secret and use it only as allowed. *P7*
- **Consequential (indirect) losses**: Knock-on losses such as lost profits; PayNest wants these excluded. *P1*
- **DPA** *(Data Processing Agreement)*: The part of a contract about how PayNest handles the client's employee data.
- **DPDP Act**: India's Digital Personal Data Protection Act, 2023. *Considered and not used as the yardstick.*
- **Force majeure**: A clause excusing a party when events beyond its control happen (floods, war).
- **General Counsel** *(GC)*: The head of a company's legal team.
- **Governing law**: Which country's law applies to the contract. *P10*
- **Hold harmless**: A promise not to hold the other party responsible; usually paired with indemnity. *P2*
- **In-house legal**: Lawyers employed by the company itself, not an outside law firm.
- **Indemnity**: A promise to cover the other party's costs if a third party sues them. *P2*
- **Jurisdiction**: Which courts can hear a dispute. *P10*
- **Limitation of liability**: A clause capping how much a party must pay. *P1*
- **MSA** *(Master Services Agreement)*: The umbrella contract with the main legal terms.
- **Mutual (clause)**: A clause that applies equally to both parties. *P2, P7*
- **NDA** *(Non-Disclosure Agreement)*: A confidentiality-only contract.
- **Order form**: A short document with the deal specifics (headcount, price, start date).
- **Our paper**: PayNest's own standard contract template.
- **Pilot / POC** *(Proof of Concept)*: A short trial agreement before the full contract, often on dummy data. *Contract 5*
- **Redline**: A marked-up version of a contract showing proposed changes. *Out of scope.*
- **Sell-side contract**: A contract where PayNest is the one being hired (the Provider). *Our scope.*
- **Service credits**: Fee discounts PayNest gives if it misses an SLA. *P4*
- **SLA** *(Service Level Agreement)*: Promised service levels (e.g. 99.5% uptime) and penalties. *P4*
- **Sole remedy**: When service credits are the *only* compensation for an SLA miss. *P4*
- **SOW** *(Statement of Work)*: The specific job, deliverables and price under an MSA.
- **Super-cap**: A higher, separate liability cap for specific risks such as data breach. *P1*
- **Termination for convenience**: The right to end a contract without giving a reason. *P9*
- **Third-party claim**: A lawsuit from someone outside the contract (e.g. a client's employees). *P2*
- **Uncapped / unlimited liability**: No upper limit on what a party must pay. *P1 walk-away*

## HR and payroll terms

- **CTC** *(Cost to Company)*: The total annual cost of an employee, including salary and benefits.
- **ESI** *(Employees' State Insurance)*: A statutory health insurance scheme for lower-wage employees in India.
- **HRMS** *(Human Resource Management System)*: Software for HR records, leave, attendance and payroll.
- **IFSC**: An Indian bank branch code used for salary transfers.
- **PAN** *(Permanent Account Number)*: Indian tax ID.
- **Payroll run**: The monthly process of computing and paying salaries.
- **Payslip**: The monthly salary statement for an employee.
- **PEO** *(Professional Employer Organization)*: A company that handles HR and payroll for other businesses (e.g. Sequoia).
- **PF / EPF** *(Provident Fund)*: A retirement savings scheme with employer and employee contributions.
- **Private payroll provider**: A payroll company that runs on its own infrastructure, with no public cloud or outside processors. *PayNest*
- **Salary disbursement**: Sending the final salary payments to employees' bank accounts.
- **TDS** *(Tax Deducted at Source)*: Income tax deducted from salary by the employer.
- **UAN** *(Universal Account Number)*: An employee's PF account number.

## AI and ML terms

- **Answer relevancy**: A Ragas metric: does the answer address the question?
- **Chunk**: A piece of the document stored for retrieval; for us, roughly one clause.
- **Confusion matrix**: A table of predicted vs true statuses, showing which mistakes happen.
- **Context precision**: A Ragas metric: are the retrieved clauses actually relevant?
- **Context recall**: A Ragas metric: did retrieval find all the clauses needed?
- **Embedding**: A list of numbers representing text meaning; similar text gives similar numbers.
- **Faithfulness**: A Ragas metric: is every claim in the answer supported by the retrieved text?
- **Few-shot prompting**: Giving the model a few worked examples in the prompt.
- **Hallucination**: When a model states something that isn't true or isn't in the source. *C1 Mata v. Avianca*
- **LangGraph**: A library for building agent workflows as graphs with state, loops and pauses.
- **LLM** *(Large Language Model)*: A model that reads and writes text (Llama, Qwen).
- **LLM-as-judge**: Using one LLM to grade another's output. *Llama 3.1 8B is our judge.*
- **Perspective rule**: The prompt instruction that the model must judge risk from PayNest's (the Provider's) side.
- **Prompt injection**: Text inside input data that tries to override the model's instructions.
- **Quantisation** *(Q4)*: Shrinking a model's numbers to 4 bits so it fits on a laptop, with small quality loss.
- **RAG** *(Retrieval-Augmented Generation)*: Retrieve relevant text first, then let the LLM answer from it.
- **Ragas**: An open-source Python library for evaluating RAG systems.
- **Strict JSON output**: Forcing the model to reply in an exact structured format.
- **Temperature**: Randomness of model output; 0 = most deterministic.
- **Top-k**: The number of most-similar chunks retrieved (e.g. top 5).
- **Vector store**: A database that stores embeddings and finds similar ones; we use Chroma.

## Infrastructure and observability terms

- **Air-gapped**: A system with no connection to the internet.
- **Bifrost**: An open-source LLM gateway giving one OpenAI-style endpoint, with routing, failover and caching.
- **Checkpointer**: LangGraph's way of saving workflow state so it can pause and resume.
- **Data centre**: A building that houses servers; PayNest owns its own (Bengaluru main, Pune backup).
- **Docker Compose**: A tool to run several containers together from one file.
- **Egress**: Outbound network traffic (from the machine to the internet).
- **Failover**: Automatically switching to a backup when something fails.
- **FDE** *(Forward Deployed Engineer)*: An engineer who builds and deploys solutions on-site at a client.
- **Gateway** (LLM gateway): A single entry point in front of models that routes requests.
- **Interrupt** (LangGraph): A pause in the graph that waits for human input.
- **ISO 27001**: An international certification for information security management. *P5*
- **Langfuse**: An open-source, self-hostable tool for LLM tracing, scores and dashboards.
- **LangSmith**: A hosted tracing tool from LangChain. *Not used: it is hosted, so traces would leave the machine.*
- **Ollama**: A tool that runs open LLMs locally behind a simple API.
- **On-prem**: Running on the company's own hardware, not the cloud.
- **OpenAI-compatible endpoint**: An API that accepts the same request format as OpenAI's, so standard clients work.
- **OpenTelemetry** *(OTel)*: An open standard for sending traces and metrics.
- **Semantic cache**: Reusing a previous answer when a new question means the same thing.
- **Span**: One step inside a trace (e.g. "retrieve clauses").
- **Trace**: The full recorded path of one request through the system.
- **Uptime**: The percentage of time a service is available. *P4*
