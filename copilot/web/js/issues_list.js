// Issues List: the negotiation document issued to the counterparty after counsel approval.
// Internal information (approval authorities, risk weights) is deliberately excluded.
// Also the Audit trail tab: every counsel decision with name, time, status change and reason.
import { $, escapeHtml, label, state } from "./ui.js";

// Formal legal wording for the document sent to the counterparty (the app itself uses plain labels).
const FORMAL = { Partial: "Fallback position", Conflicting: "Non-standard", Missing: "Not addressed",
  "Needs review": "Under review" };

const dateLong = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

function clauseRef(issue) {
  if (!issue.clause_ref) return "Not addressed";
  return issue.clause_ref.replace(/^clause\s+/i, "") + (issue.page && !issue.clause_ref.includes("p.") ? ` (p. ${issue.page})` : "");
}

function asText(r) {
  const head = `ISSUES LIST\n${r.matter.reference || ""} | ${r.matter.counterparty || r.file_name}\n`;
  const rows = r.issues.map((i, n) => `${n + 1}. ${i.title} [${clauseRef(i)}]\n   Proposed amendment: ${i.proposed_amendment}`);
  return `${head}\n${rows.join("\n\n")}\n\nPayNest reserves its position on all other provisions of the draft.`;
}

export function renderIssuesList() {
  const box = $("#issues-list");
  if (state.review?.state !== "final") {
    box.innerHTML = `<p class="placeholder">The Issues List is issued once counsel has approved the review.</p>`;
    return;
  }
  const r = state.review.report;
  const m = r.matter || {};
  const rows = r.issues.map((i, n) => `<tr>
      <td>${n + 1}</td><td>${escapeHtml(clauseRef(i))}</td>
      <td><strong>${escapeHtml(i.title)}</strong><br><span class="muted">${escapeHtml(FORMAL[i.status] || i.status)}</span></td>
      <td class="q">${i.client_drafting ? `"${escapeHtml(i.client_drafting)}"` : "No provision."}</td>
      <td>${escapeHtml(i.proposed_amendment)}</td></tr>`).join("");
  box.innerHTML = `
    <div class="memo__tools">
      <button class="btn btn--quiet" id="copy-issues" type="button">Copy as text</button>
      <button class="btn btn--quiet" id="print-issues" type="button">Print</button>
    </div>
    <article class="memo">
      <h2>ISSUES LIST</h2>
      <p class="memo__sub">Privileged and confidential. Without prejudice. Prepared for negotiation.</p>
      <dl class="memo__head">
        <dt>Matter</dt><dd>${escapeHtml(m.reference || "—")}</dd>
        <dt>Counterparty</dt><dd>${escapeHtml(m.counterparty || "—")}</dd>
        <dt>Agreement</dt><dd>${escapeHtml(m.agreement_type || "Agreement")} (counterparty draft: ${escapeHtml(r.file_name)})</dd>
        <dt>Prepared by</dt><dd>${escapeHtml(r.reviewer)}, Legal, PayNest Technologies Private Limited</dd>
        <dt>Date</dt><dd>${dateLong(r.created_at)}</dd>
      </dl>
      ${r.issues.length ? `<p>PayNest has reviewed the counterparty's draft and proposes the amendments set out below.
        Clause references are to the counterparty's draft.</p>
        <div class="table-card"><table class="grid-table"><thead><tr><th>No.</th><th>Clause</th><th>Issue</th>
        <th>Counterparty draft</th><th>PayNest proposed amendment</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : "<p>PayNest has reviewed the counterparty's draft and has no amendments to propose.</p>"}
      <p class="memo__close">PayNest reserves its position on all other provisions of the draft, and this Issues List is
        not an offer capable of acceptance.</p>
    </article>`;
  $("#copy-issues").addEventListener("click", async (e) => {
    try { await navigator.clipboard.writeText(asText(r)); e.target.textContent = "Copied"; }
    catch { e.target.textContent = "Copy unavailable"; }
  });
  $("#print-issues").addEventListener("click", () => window.print());
}

// ---- Audit trail ----

const when = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const ACTION = { approve: "Agreed", override: "Changed the status", note: "Added a note" };

export function renderAudit() {
  const box = $("#audit");
  if (state.review?.state !== "final") {
    box.innerHTML = `<p class="placeholder">Your decisions appear here once the review is approved.</p>`;
    return;
  }
  const r = state.review.report;
  const rows = r.audit.map((a) => `<tr><td>${escapeHtml(when(a.at))}</td><td>${escapeHtml(a.reviewer)}</td>
      <td>${a.rule_id}</td><td>${escapeHtml(ACTION[a.action] || a.action)}</td>
      <td>${escapeHtml(label(a.old_status))} → ${escapeHtml(label(a.new_status))}</td>
      <td>${escapeHtml(a.note || "—")}</td></tr>`).join("");
  const approved = `<tr><td>${escapeHtml(when(r.created_at))}</td><td>${escapeHtml(r.reviewer)}</td><td>—</td>
      <td>Review approved</td><td>Risk rating ${escapeHtml(r.final_result.band)} (${r.final_result.score}/100)</td><td>—</td></tr>`;
  box.innerHTML = `
    <div class="table-card"><table class="grid-table">
      <thead><tr><th>Date and time</th><th>Lawyer</th><th>Rule</th><th>Decision</th><th>Status</th><th>Why</th></tr></thead>
      <tbody>${rows}${approved}</tbody></table></div>
    <p class="table-note" style="margin-top:10px">Review ${escapeHtml(r.review_id)} · Contracting Standards ${escapeHtml(r.standards_version)}
      · Trace ${escapeHtml(r.trace_id ?? "not recorded")}</p>`;
}
