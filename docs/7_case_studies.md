# 2 · Case Studies

Real incidents we use to explain **why** this project matters. Each case maps to a project feature or a standard.

> **Accuracy note:** some figures vary between sources (headcounts, settlement amounts). When teaching, use the safe wording given in each case and check figures against the primary source.

**How the cases fit PayNest's story:**
1. **Why PayNest exists:** vendor-chain breaches (Zellis, Myrocket).
2. **Why clients send harsh contracts, and why PayNest must push back:** payroll failures and the lawsuits that follow (Kronos, Sequoia, Air India).
3. **Why the legal tool must be local:** Samsung.
4. **Why we verify AI output:** Mata v. Avianca.
5. **Why automate review:** JPMorgan COIN, WorldCC.

---

## ★ Hero case: Zellis / MOVEit (UK, June 2023), PayNest's founding story

**What happened**
- Zellis, a **UK payroll provider**, was hacked through a flaw in **MOVEit**, a file-transfer tool it bought from another vendor.
- Its clients, including **British Airways, the BBC and Boots**, had staff payroll data stolen: names, addresses, National Insurance numbers and dates of birth. Some reports also mention bank details, but the BBC said its staff's bank details were not affected.
- BA, the BBC and Boots were **never hacked directly**. They lost data through their payroll provider's vendor.

**Why it matters for PayNest**
- It's **why PayNest runs everything itself**: no vendor's vendor.
- It's **why clients now send strict contracts** (fast breach notice, audits, deletion). After Zellis, every large employer worries about its payroll provider. PayNest must accept *reasonable* versions of these demands, and our tool spots the *unreasonable* ones.

**Maps to:** P3 Breach notice · P5 Audit · P7 Confidentiality (no sharing)

**Safe slide wording:** *"In 2023 British Airways, the BBC and Boots lost staff payroll data without being hacked. Their payroll provider's file-transfer vendor was."*

Sources: [Security Affairs](https://securityaffairs.com/147119/data-breach/zellis-data-breach-bbc-ba.html?mid=1) · [Insurance Journal](https://www.insurancejournal.com/news/international/2023/06/06/724182.htm) · [CIPP](https://www.cipp.org.uk/resources/news/major-uk-companies-hit-by-cyber-attack.html)

---

## A. Payroll and HR failures: why clients write harsh contracts

### A1. Kronos / UKG ransomware (US, Dec 2021)
- A ransomware attack took down time and payroll software for about **2,000 employers for weeks**.
- Workers sued **their own employers** (Tesla, PepsiCo, Cargill and others) over wrong or late wages. Cargill settled for $2.4M. UKG itself faced lawsuits and settlements.
- **For PayNest:** this is why clients want unlimited liability and big SLA penalties, and **why PayNest must cap them**. One outage across 400 clients could produce claims far larger than PayNest's revenue.
- **Maps to:** P1 Liability cap · P2 Indemnity · P4 SLA and credits
- Sources: [HR Dive](https://www.hrdive.com/news/ukg-to-settle-class-action-lawsuit-with-workers-affected-by-kronos-outage/647753/) · [Cybersecurity Dive](https://www.cybersecuritydive.com/news/cargill-kronos-ransomware-outage-settlement/702269/)

### A2. Sequoia Benefits (US, 2022)
- A US HR, payroll and benefits provider had its cloud storage breached. Client employees' **Social Security numbers, wage data and COVID test results** were exposed.
- The class action reached an **$8.7M settlement** (preliminary approval Sept 2025).
- **For PayNest:** shows how big a payroll provider's legal exposure gets after a breach, which is why "any and all claims" indemnities are dangerous.
- **Maps to:** P1 · P2 · P6 Deletion (why keep old data?)
- Sources: [TechCrunch](https://techcrunch.com/2022/12/12/sequoia-human-resources-hackers/) · [ClassAction.org](https://www.classaction.org/news/8.7m-sequoia-settlement-resolves-data-breach-lawsuit-over-2022-cloud-system-hack)

### A3. Air India / SITA (India, 2021)
- SITA, Air India's passenger-system vendor, was breached, and **4.5M passengers' data going back to 2011** leaked.
- Air India was told in February but received details of which passengers were affected only in late March and April.
- **For PayNest:** this is why clients demand **fast** breach notice. PayNest can commit to 24 hours, but "immediately" is a promise nobody can keep.
- **Maps to:** P3 Breach-notice commitment · P6 Deletion
- Sources: [The Record](https://therecord.media/air-india-says-data-breach-impacts-4-5-million-former-passengers/) · [Dark Reading](https://www.darkreading.com/cyberattacks-data-breaches/air-india-confirms-data-of-4-5m-travelers-compromised)

### A4. Myrocket (India, Dec 2022)
- An Indian HR and recruitment platform left a **260 GB database publicly open**: about 2 lakh employees, about 90 lakh job applicants, and **21,000 salary sheets** of client companies.
- Researchers said attackers could have **changed salary amounts and bank accounts**.
- **For PayNest:** Indian proof of why companies are moving to private payroll providers, and why confidentiality clauses matter.
- **Maps to:** P7 Confidentiality · the PayNest business model
- Source: [Security Affairs](https://securityaffairs.com/140957/data-breach/myrocket-hr-platforms-data-leak.html)

---

## B. AI used carelessly with confidential data

### B1. Samsung + ChatGPT (2023)
- Within weeks of being allowed to use ChatGPT, engineers pasted **confidential source code and meeting notes** into it at least three times.
- Samsung banned generative AI on company devices and started building internal tools.
- **For PayNest:** if the legal team pasted a hospital's contract into ChatGPT, PayNest would break its own confidentiality promise. Hence the **fully local architecture**.
- Sources: [The Register](https://www.theregister.com/2023/04/06/samsung_reportedly_leaked_its_own) · [TechRadar](https://www.techradar.com/news/samsung-bans-chatgpt-use-after-employee-leak)

---

## C. AI making things up in legal work

### C1. Mata v. Avianca (US, 2023)
- Lawyers filed a brief citing **cases ChatGPT invented**, with fake quotes. ChatGPT "confirmed" that the cases were real.
- The court fined the lawyers **$5,000**.
- **For PayNest:** every finding must quote the contract word for word (the **grounding guard**), and a human signs off (the **human gate**).
- Sources: [Wikipedia](https://en.wikipedia.org/wiki/Mata_v._Avianca,_Inc.) · [LawNext](https://www.lawnext.com/2023/06/court-imposes-sanctions-on-lawyers-who-filed-bogus-cases-after-relying-on-chatgpt-for-legal-research.html)

---

## D. Legal review is slow and costly

### D1. JPMorgan COIN (2017)
- JPMorgan built software that reviews **12,000 commercial loan agreements a year**, work it said took **360,000 hours** of lawyer and loan-officer time (self-reported, Bloomberg).
- **For PayNest:** even the biggest bank automated first-pass contract review; a 3-person legal team needs it more.
- Sources: [Bloomberg](https://www.bloomberg.com/news/articles/2017-02-28/jpmorgan-marshals-an-army-of-developers-to-automate-high-finance) · [ABA Journal](https://www.abajournal.com/news/article/jpmorgan_chase_uses_tech_to_save_360000_hours_of_annual_work_by_lawyers_and)

### D2. WorldCC research (2025)
- Businesses lose **almost 9% of value** each year through poor contract management. The best performers lose about 3% and the worst more than 15%.
- **For PayNest:** the money argument for consistent, standards-based review.
- Source: [WorldCC](https://info.worldcc.com/contract-management-aug-2025)

---

## Case → feature map

| Case | Business model | Local-only | Standards | Grounding guard | Human gate | Speed |
|---|:-:|:-:|---|:-:|:-:|:-:|
| Zellis / MOVEit | ✅ | | P3, P5, P7 | | | |
| Kronos / UKG | | | P1, P2, P4 | | | |
| Sequoia | | | P1, P2, P6 | | | |
| Air India / SITA | | | P3, P6 | | | |
| Myrocket | ✅ | | P7 | | | |
| Samsung | | ✅ | | | | |
| Mata v. Avianca | | | | ✅ | ✅ | |
| JPMorgan COIN | | | | | | ✅ |
| WorldCC | | | | | | ✅ |

## The 2-minute teaching story

1. **Hook (Zellis):** BA lost staff payroll data without being hacked. Its payroll provider's file-transfer vendor was.
2. **Enter PayNest:** PayNest was built so there is no vendor's vendor: own servers, own backups, own staff. *"Your payroll data never leaves PayNest."*
3. **The catch (Kronos, Air India):** after breaches like these, clients send PayNest harsh contracts: unlimited liability, "notify immediately", audits any time. Accept one bad clause and a single incident could sink PayNest.
4. **The bottleneck:** 3 lawyers, 60+ contracts a month, all reviewed by hand. Hiring more is expensive.
5. **Why not ChatGPT (Samsung):** pasting a hospital's contract into ChatGPT breaks the exact promise PayNest sells.
6. **Why we verify (Avianca):** AI invents things, so every finding quotes the contract and a human signs off.
7. **Why automate (COIN, WorldCC):** minutes instead of weeks, consistent decisions, and less value leaking out of contracts.

## Left out on purpose

- **Darwinbox (India):** a security firm reported vulnerabilities, and Darwinbox denies any breach. Because the claim is disputed, we don't use it.
