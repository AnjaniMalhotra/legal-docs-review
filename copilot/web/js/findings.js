// Review tab: approval notice, severity filters and one expandable card per standard.
// Native <details> handles expand/collapse; clicking "Show in agreement" scrolls to the highlight.
import { goToRule } from "./document_view.js";
import { decisionControls } from "./review.js";
import { showView } from "./views.js";
import { $, GROUPS, currentFindings, escapeHtml, sevOf, state, statusPill } from "./ui.js";

const ALERT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 21h20L12 3zM12 10v5M12 18v.5"/></svg>`;
const ORDER = { bad: 0, info: 1, warn: 2, ok: 3 };
let filter = "all";

function quote(f) {
  if (!f.evidence_quote) return `<p class="quote quote--none">The contract says nothing about this.</p>`;
  const where = [f.clause_ref && `Clause ${f.clause_ref.replace(/^clause\s+/i, "")}`, f.page && `page ${f.page}`].filter(Boolean).join(", ");
  return `<blockquote class="quote">"${escapeHtml(f.evidence_quote)}"<cite>${escapeHtml(where)}</cite></blockquote>`;
}

function approver(f, std) {
  if (!std.approval || sevOf(f.status) === "ok") return "No approval required";
  return `Who can approve: <strong>${escapeHtml(f.status === "Partial" ? std.approval.fallback : std.approval.walk_away)}</strong>`;
}

function card(f, flagged) {
  const std = state.standards[f.rule_id] || {};
  const decided = f.reviewer_decision
    ? `<p class="decided">Lawyer's decision: ${escapeHtml(f.reviewer_decision)}${f.reviewer_note ? `, "${escapeHtml(f.reviewer_note)}"` : ""}</p>` : "";
  return `
    <details class="issue sev-${sevOf(f.status)}" id="issue-${f.rule_id}" data-rule="${f.rule_id}" ${flagged ? "open" : ""}>
      <summary>
        <span class="issue__title">${escapeHtml(f.title)}<small>${f.rule_id} · ${escapeHtml(std.category || "")}${std.critical ? " · Key rule" : ""}</small></span>
        ${statusPill(f.status)}</summary>
      <div class="issue__body">
        <div><p class="issue__label">What the contract says</p>${quote(f)}
          <p class="issue__label">Why</p><p class="issue__text">${escapeHtml(f.reason)}</p></div>
        <div><p class="issue__label">What PayNest wants</p><p class="issue__text">${escapeHtml(std.preferred || "")}</p></div>
        <div class="issue__meta issue__full"><span>${approver(f, std)}</span>
          ${f.page ? `<button class="link-btn" type="button" data-goto="${f.rule_id}" data-page="${f.page}">Show in agreement</button>` : ""}</div>
        <div class="issue__full">${flagged ? decisionControls(f) : decided}</div>
      </div>
    </details>`;
}

function notice(review) {
  const n = review.flagged.length;
  return `${ALERT}<div><strong>A lawyer must approve this review.</strong>
    ${n ? `Make a decision on each of the ${n} marked item${n > 1 ? "s" : ""} below, then approve.` : "Check the results, then approve."}</div>`;
}

function renderFilters(findings) {
  const count = (sev) => findings.filter((f) => sevOf(f.status) === sev).length;
  const chips = [{ sev: "all", title: "All", n: findings.length }, ...GROUPS.map((g) => ({ ...g, n: count(g.sev) }))];
  $("#filters").innerHTML = chips.filter((c) => c.n || c.sev === "all").map((c) =>
    `<button class="filter" type="button" data-sev="${c.sev}" aria-pressed="${c.sev === filter}">${c.title}<b>${c.n}</b></button>`).join("");
}

export function renderFindings() {
  const review = state.review;
  const awaiting = review.state === "awaiting_review";
  const flagged = awaiting ? review.flagged : [];
  const findings = [...currentFindings()].sort((a, b) => ORDER[sevOf(a.status)] - ORDER[sevOf(b.status)]);
  $("#gate").hidden = !awaiting;
  $("#gate").innerHTML = awaiting ? notice(review) : "";
  $("#signoff").hidden = !awaiting;
  renderFilters(findings);
  const shown = findings.filter((f) => filter === "all" || sevOf(f.status) === filter);
  $("#findings").innerHTML = shown.map((f) => card(f, flagged.includes(f.rule_id))).join("");
}

// Open a card from elsewhere (e.g. a highlight in the agreement was clicked).
export function openIssue(ruleId) {
  const card = document.getElementById(`issue-${ruleId}`);
  if (!card) return;
  showView("review");
  document.querySelectorAll(".issue.is-active").forEach((c) => c.classList.remove("is-active"));
  card.open = true;
  card.classList.add("is-active");
  card.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function initFindings() {
  $("#findings").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-goto]");
    if (btn) goToRule(btn.dataset.goto, Number(btn.dataset.page));
  });
  $("#filters").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-sev]");
    if (!chip) return;
    filter = chip.dataset.sev;
    renderFindings();
  });
}

export const resetFilter = () => { filter = "all"; };
