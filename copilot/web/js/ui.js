// Shared state, display labels and small DOM helpers used by every module.

export const $ = (selector, root = document) => root.querySelector(selector);

// Current matter: intake details, document, Contracting Standards (by id) and the review.
export const state = { docId: null, doc: null, matter: {}, standards: {}, review: null };

// Internal status codes (stable data contract) -> plain-English labels shown in the app.
// The outgoing Issues List keeps formal legal wording (see issues_list.js).
export const STATUS_LABEL = {
  Compliant: "OK", Partial: "Acceptable", Conflicting: "Not acceptable", Missing: "Missing",
  "Silent (OK)": "Not mentioned (fine)", "N/A": "Doesn't apply", "Needs review": "Needs a lawyer's check",
};
export const label = (status) => STATUS_LABEL[status] || status;

// Status -> severity. Drives pill colour, card edge, highlight colour and the review filters.
const SEVERITY = {
  Conflicting: "bad", Missing: "bad", "Needs review": "info",
  Partial: "warn", Compliant: "ok", "Silent (OK)": "ok", "N/A": "ok",
};
export const GROUPS = [
  { sev: "bad", title: "Must fix" }, { sev: "info", title: "Check" },
  { sev: "warn", title: "Acceptable" }, { sev: "ok", title: "OK" },
];
export const sevOf = (status) => SEVERITY[status] || "ok";

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

// "Silent (OK)" -> "silent-ok", "N/A" -> "n-a" (CSS class suffixes)
export const slug = (text) => String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const statusPill = (status) => `<span class="pill s-${slug(status)}">${escapeHtml(label(status))}</span>`;

export function setStatus(el, message, kind = "") {
  el.textContent = message;
  el.className = `status${kind ? ` is-${kind}` : ""}`;
}

// Workflow stage -> status badge in the matter header.
const STAGES = { received: "Draft received", review: "Under review", approval: "Awaiting counsel approval",
  approved: "Approved by counsel", cleared: "Cleared: no escalations" };
export function setWorkflow(stage) {
  const el = $("#stage");
  el.dataset.stage = stage;
  el.textContent = STAGES[stage];
}

export const reviewerName = () => $("#reviewer").value.trim();

// The current review's findings, whether awaiting approval or final.
export function currentFindings() {
  const r = state.review;
  if (!r) return [];
  return r.state === "awaiting_review" ? r.findings : r.report.findings;
}

// Remember counsel's name in this browser only (convenience, never required).
export function persistReviewer() {
  const input = $("#reviewer");
  try { input.value = localStorage.getItem("copilot.reviewer") || ""; } catch { /* ignore */ }
  input.addEventListener("change", () => {
    try { localStorage.setItem("copilot.reviewer", input.value.trim()); } catch { /* ignore */ }
  });
}
