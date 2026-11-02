# PayNest Contracting Standards v1.0

**Company policy · Client agreements (PayNest is the Service Provider) · Owner: General Counsel**

Every contract a client asks PayNest to sign is checked against these 10 standards. For each one
the policy states what PayNest wants (Ideal), what it can live with after negotiation (Can accept),
what it never signs without senior approval (Never accept), and who may approve a deviation.

> Generated from `copilot/config/standards/*.yaml`, the same rules the Contract Copilot enforces.
> Do not edit by hand: change the YAML and run `scripts/build_policy_doc.py`. PayNest is fictional.

| Ref. | Provision | Weight | Key rule | If the contract is silent |
|---|---|:-:|:-:|---|
| P1 | Limitation of Liability | 5 | Yes | Missing (counts as full risk) |
| P2 | Indemnification | 5 | Yes | Not mentioned (fine) |
| P3 | Security Incident Notification | 5 | Yes | Not mentioned (fine) |
| P4 | Service Levels and Service Credits | 4 |  | Not mentioned (fine) |
| P5 | Audit and Inspection Rights | 3 |  | Not mentioned (fine) |
| P6 | Return and Deletion of Client Data | 3 |  | Not mentioned (fine) |
| P7 | Confidentiality | 4 |  | Missing (counts as full risk) |
| P8 | Fees, Invoicing and Payment | 2 |  | Missing (counts as full risk) |
| P9 | Term and Termination | 2 |  | Missing (counts as full risk) |
| P10 | Governing Law and Dispute Resolution | 2 |  | Missing (counts as full risk) |

## P1 · Limitation of Liability
*Risk Allocation · Weight 5 · Key rule · If silent: Missing (counts as full risk)*

**Why it matters.** A payroll outage or security incident affects every employee of a client at once, and claims aggregate quickly (cf. Kronos/UKG, 2021). PayNest's professional indemnity and cyber insurance are sized to a liability cap of twelve months' fees. Uncapped exposure on a single agreement can exceed the lifetime value of the relationship and is not insurable.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | Each Party's aggregate liability arising out of or in connection with the Agreement is capped at the Fees paid or payable in the twelve (12) months preceding the event giving rise to the claim. Neither Party is liable for indirect, special or consequential loss, or for loss of profit, revenue, goodwill or anticipated savings. Standard carve-outs (fraud, wilful misconduct, death or personal injury caused by negligence) apply without limit. | Standard terms |
| 🟠 Can accept | A separate, higher cap ("super-cap") for breach of the data protection and confidentiality obligations, not exceeding twenty-four (24) months' Fees, with the general cap remaining at twelve (12) months' Fees and the exclusion of indirect loss preserved. | Legal Counsel |
| ⛔ Never accept | Unlimited or uncapped liability (generally or for data breach); any cap exceeding twenty-four (24) months' Fees; deletion of the exclusion of indirect and consequential loss; or liability for loss of profit of the Client's own customers or employees. | General Counsel and Chief Financial Officer |

**PayNest's standard clause.** "Subject to Clause 14.3, the aggregate liability of each Party arising out of or in connection with this Agreement, whether in contract, tort (including negligence), breach of statutory duty or otherwise, shall not exceed the total Fees paid or payable in the twelve (12) months immediately preceding the event giving rise to the claim."

**What to ask the client for.** Delete the unlimited-liability wording and insert PayNest's standard cap of twelve (12) months' Fees. If required to close, offer a data-protection super-cap of up to twenty-four (24) months' Fees and retain the exclusion of indirect and consequential loss.

**Does not apply when.** Never. Every client agreement must allocate liability.

## P2 · Indemnification
*Risk Allocation · Weight 5 · Key rule · If silent: Not mentioned (fine)*

**Why it matters.** Indemnities shift third-party claims between the Parties. Payroll errors frequently originate in Client-supplied master data (attendance, joining and exit records). A broad, fault-blind indemnity would make PayNest the insurer of the Client's own processes.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | Mutual indemnities limited to third-party claims to the extent caused by the indemnifying Party's proven breach of the Agreement, negligence or wilful misconduct, subject to the limitation of liability, with customary conduct-of-claims provisions (prompt notice, control of defence, reasonable co-operation, duty to mitigate). | Standard terms |
| 🟠 Can accept | A one-way indemnity from PayNest limited to named heads of claim (third-party intellectual property infringement; data breach caused by PayNest's breach of its security obligations), capped at the data-protection super-cap. | Legal Counsel |
| ⛔ Never accept | Indemnity for "any and all claims" arising out of or relating to the Services regardless of fault; uncapped indemnity; indemnity covering losses caused by the Client's own negligence, instructions or data; or indemnity for regulatory fines levied on the Client. | General Counsel |

**PayNest's standard clause.** "Each Party (the Indemnifying Party) shall indemnify the other Party against losses arising from any third-party claim to the extent caused by the Indemnifying Party's breach of this Agreement, negligence or wilful misconduct, subject always to Clause 14 (Limitation of Liability)."

**What to ask the client for.** Make the indemnity mutual and fault-based, limit it to third-party claims caused by the indemnifying Party's breach, negligence or wilful misconduct, and subject it expressly to the limitation of liability.

**Does not apply when.** Never.

## P3 · Security Incident Notification
*Data Protection · Weight 5 · Key rule · If silent: Not mentioned (fine)*

**Why it matters.** PayNest's Incident Response Policy confirms and scopes a suspected incident within 24 hours. An undefined or sub-12-hour deadline places PayNest in breach of contract from the moment an investigation begins, and premature notice risks inaccurate statements to the Client (cf. Air India / SITA, 2021, where affected-data details took weeks to establish).

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | Notice to the Client without undue delay and in any event within twenty-four (24) hours of PayNest confirming a Security Incident affecting Client Personal Data, followed by a written incident report within seventy-two (72) hours describing the nature of the incident, categories of data and data principals affected, and remedial measures. | Standard terms |
| 🟠 Can accept | A fixed notification window of twelve (12) to less than twenty-four (24) hours from confirmation, or twenty-four (24) hours from discovery rather than confirmation. | Legal Counsel with Chief Information Security Officer |
| ⛔ Never accept | "Immediately", "forthwith", "without any delay" or any other undefined deadline; any window of less than twelve (12) hours; or an obligation on PayNest to notify the Client's employees, regulators or other third parties directly on the Client's behalf. | General Counsel |

**PayNest's standard clause.** "The Service Provider shall notify the Client without undue delay, and in any event within twenty-four (24) hours of confirming a Security Incident affecting Client Personal Data, and shall provide a written incident report within seventy-two (72) hours of such notification."

**What to ask the client for.** Replace "immediately" with notification within twenty-four (24) hours of confirmation of a Security Incident, with a written incident report to follow within seventy-two (72) hours.

**Does not apply when.** The agreement involves no live Client Personal Data (for example a pilot on synthetic data).

## P4 · Service Levels and Service Credits
*Performance · Weight 4 · If silent: Not mentioned (fine)*

**Why it matters.** PayNest operates its own data centres with an engineering target of 99.5% monthly availability, excluding scheduled maintenance. Service credits are a liquidated, capped remedy; uncapped penalties or damages layered on top of credits make every incident a litigation event.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | 99.5% Availability measured monthly, excluding Scheduled Maintenance notified at least seventy-two (72) hours in advance; service credits are the Client's sole and exclusive remedy for failure to meet the Availability target and are capped at ten percent (10%) of the monthly Fees. | Standard terms |
| 🟠 Can accept | Availability of up to 99.9%, or a service-credit cap of up to twenty percent (20%) of the monthly Fees, provided credits remain the sole and exclusive remedy. | Legal Counsel |
| ⛔ Never accept | Availability above 99.9%; uncapped penalties or liquidated damages; credits in addition to damages and a right to terminate for a single failure; or penalties for payroll errors caused by Client-supplied data or late approvals. | General Counsel and Head of Service Delivery |

**PayNest's standard clause.** "The Service Provider shall make the Platform available 99.5% of each calendar month, excluding Scheduled Maintenance. Service Credits set out in Schedule 3 shall be the Client's sole and exclusive remedy for any failure to meet the Availability target."

**What to ask the client for.** Align the Availability target to 99.5% excluding Scheduled Maintenance, cap service credits at ten percent (10%) of monthly Fees, and confirm credits are the sole and exclusive remedy.

**Does not apply when.** There is no live production service (for example a pilot or proof of concept).

## P5 · Audit and Inspection Rights
*Data Protection · Weight 3 · If silent: Not mentioned (fine)*

**Why it matters.** PayNest's data centres host the data of more than four hundred clients. Unrestricted on-site access by one client's auditors risks exposure of other clients' environments and disrupts operations. PayNest maintains ISO/IEC 27001 certification and an annual independent audit precisely so that clients can rely on assurance reports.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | On-site audit no more than once in any twelve (12) month period, on not less than thirty (30) days' written notice, during business hours, at the Client's cost, by an auditor bound by confidentiality who is not a competitor of PayNest; or, at PayNest's election, provision of its current ISO/IEC 27001 certificate and most recent independent audit report in lieu. | Standard terms |
| 🟠 Can accept | Up to two (2) audits in any twelve (12) month period, or a notice period of not less than fifteen (15) days, with all other preferred conditions retained. | Legal Counsel |
| ⛔ Never accept | Unannounced or "at any time" audits; unlimited frequency; audits by a competitor of PayNest; or access to premises, systems or records holding the data of PayNest's other clients. | General Counsel and Chief Information Security Officer |

**PayNest's standard clause.** "The Client may, not more than once in any twelve (12) month period and on not less than thirty (30) days' written notice, audit the Service Provider's compliance with this Agreement, provided that such audit shall not extend to systems or records relating to the Service Provider's other customers."

**What to ask the client for.** Limit audits to once in any twelve (12) month period on thirty (30) days' written notice, during business hours, and offer PayNest's ISO/IEC 27001 certificate and annual audit report in lieu.

**Does not apply when.** The agreement involves no live Client Personal Data.

## P6 · Return and Deletion of Client Data
*Data Protection · Weight 3 · If silent: Not mentioned (fine)*

**Why it matters.** A complete export of a client's payroll history requires reconciliation and verification, and PayNest's encrypted backups are purged on a fixed rotation cycle. Deadlines shorter than the rotation cycle cannot be met without manual intervention in shared backup media, which itself creates risk for other clients.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | On termination or expiry, PayNest returns Client Data in a standard, machine-readable format and deletes it from production systems within thirty (30) days, with backup copies purged in the next scheduled rotation; a certificate of deletion is provided on written request. Statutory records may be retained for the period required by applicable law. | Standard terms |
| 🟠 Can accept | Return and deletion within eight (8) to twenty-nine (29) days of termination, with backup purge in the next scheduled rotation preserved. | Legal Counsel |
| ⛔ Never accept | Return and deletion within seven (7) days or less, or "immediately"; immediate deletion from all backup media; or any right for the Client to access PayNest's databases or backup systems directly. | General Counsel and Chief Information Security Officer |

**PayNest's standard clause.** "Within thirty (30) days after termination or expiry, the Service Provider shall return Client Data in a standard machine-readable format and delete it from its production systems; backup copies shall be deleted in the ordinary course of the Service Provider's backup rotation."

**What to ask the client for.** Extend the return-and-deletion period to thirty (30) days after termination, with backup copies purged in the next scheduled rotation and a certificate of deletion on written request.

**Does not apply when.** The agreement involves no live Client Personal Data.

## P7 · Confidentiality
*Information Protection · Weight 4 · If silent: Missing (counts as full risk)*

**Why it matters.** PayNest's pricing, platform design and security documentation are commercially sensitive. PayNest also undertakes to every client that its data is never shared with third parties; a clause compelling disclosure to one client's vendors would place PayNest in breach of its other client agreements.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | Mutual confidentiality obligations covering each Party's Confidential Information, including PayNest's pricing, platform architecture and security documentation, with customary exclusions (public domain, independently developed, lawfully received, compelled by law) and survival of not less than three (3) years after termination or expiry. | Standard terms |
| 🟠 Can accept | One-way confidentiality protecting only the Client's information, provided that PayNest's security documentation is protected by a separate non-disclosure agreement referenced in the Agreement. | Legal Counsel |
| ⛔ Never accept | Any obligation on PayNest to disclose Client Data, employee data, security assessments or audit reports to the Client's other service providers or third parties; or any right for the Client to publish or onward-share PayNest's security reports. | General Counsel |

**PayNest's standard clause.** "Each Party shall keep the other Party's Confidential Information confidential, use it solely for the purposes of this Agreement and not disclose it to any third party except as permitted by this Clause. This Clause shall survive for three (3) years after termination or expiry."

**What to ask the client for.** Make confidentiality mutual, extend protection to PayNest's security documentation, and delete any obligation to share data or security reports with the Client's third-party providers.

**Does not apply when.** Never.

## P8 · Fees, Invoicing and Payment
*Commercial · Weight 2 · If silent: Missing (counts as full risk)*

**Why it matters.** PayNest runs payroll on fixed monthly dates regardless of when the Client pays. Extended or conditional payment terms convert PayNest into a source of working capital for the Client and remove its leverage to suspend services for persistent non-payment.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | Invoices issued monthly in advance and payable within thirty (30) days of the invoice date; interest on overdue amounts at the rate permitted by law; and a right for PayNest to suspend the Services on written notice where undisputed amounts remain unpaid sixty (60) days after the due date. | Standard terms |
| 🟠 Can accept | Payment within thirty-one (31) to sixty (60) days of the invoice date, with the suspension right preserved. | Legal Counsel |
| ⛔ Never accept | Payment terms exceeding sixty (60) days; payment conditional on the Client's satisfaction or acceptance; or a right for the Client to withhold or set off payment indefinitely. | Chief Financial Officer |

**PayNest's standard clause.** "The Client shall pay each undisputed invoice within thirty (30) days of the invoice date. Where any undisputed amount remains unpaid sixty (60) days after its due date, the Service Provider may suspend the Services on not less than ten (10) Business Days' written notice."

**What to ask the client for.** Reduce the payment term to thirty (30) days from the invoice date (fallback: sixty (60) days) and include PayNest's right to suspend the Services for undisputed amounts outstanding beyond sixty (60) days.

**Does not apply when.** A free (unpaid) pilot.

## P9 · Term and Termination
*Commercial · Weight 2 · If silent: Missing (counts as full risk)*

**Why it matters.** Onboarding a client (configuration, data migration and a parallel payroll run) represents several months of unrecovered PayNest effort. Very short convenience-termination periods with refunds make that investment unrecoverable and invite opportunistic exit.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | Termination for convenience by the Client on not less than ninety (90) days' written notice; termination by either Party for uncured material breach after thirty (30) days' notice; no refund of Fees for Services already performed; and PayNest's right to suspend or terminate for persistent non-payment. | Standard terms |
| 🟠 Can accept | Termination for convenience on thirty (30) to eighty-nine (89) days' written notice, with all other preferred conditions retained. | Legal Counsel |
| ⛔ Never accept | Termination for convenience on less than thirty (30) days' notice; any refund of Fees for Services already performed; or the absence of any PayNest right to suspend or terminate for non-payment. | General Counsel |

**PayNest's standard clause.** "The Client may terminate this Agreement for convenience on not less than ninety (90) days' written notice to the Service Provider. Fees for Services performed up to the effective date of termination shall remain payable and shall not be refunded."

**What to ask the client for.** Set termination for convenience at ninety (90) days' written notice (fallback: thirty (30) days), exclude refunds for Services performed, and preserve PayNest's suspension right for non-payment.

**Does not apply when.** Never.

## P10 · Governing Law and Dispute Resolution
*Legal · Weight 2 · If silent: Missing (counts as full risk)*

**Why it matters.** PayNest is incorporated in Bengaluru and all its operations, data and personnel are in India. Litigating or arbitrating abroad, or in a distant Indian forum, materially increases cost and management time for a mid-size company.

| Position | What PayNest accepts | Who can approve |
|---|---|---|
| ✅ Ideal | The Agreement is governed by the laws of India, and the courts at Bengaluru have exclusive jurisdiction; or disputes are referred to arbitration under the Arbitration and Conciliation Act, 1996, seated in Bengaluru, before a sole arbitrator, in English. | Standard terms |
| 🟠 Can accept | Indian law with arbitration or court jurisdiction seated elsewhere in India (for example Mumbai or New Delhi). | Legal Counsel |
| ⛔ Never accept | Any foreign governing law, or a foreign court or arbitral seat. | General Counsel |

**PayNest's standard clause.** "This Agreement shall be governed by and construed in accordance with the laws of India. Subject to Clause 20.2, the courts at Bengaluru shall have exclusive jurisdiction over any dispute arising out of or in connection with this Agreement."

**What to ask the client for.** Provide for Indian law with exclusive jurisdiction of the courts at Bengaluru, or arbitration seated in Bengaluru under the Arbitration and Conciliation Act, 1996.

**Does not apply when.** Never.
