// The one tab bar (Summary, Agreement, Review, Issues List, Audit trail, Standards)
// and the Standards tab: the Contracting Standards the agreement is reviewed against (read-only).
import { $, escapeHtml, state } from "./ui.js";

export function showView(name) {
  document.querySelectorAll(".tabs [role=tab]").forEach((tab) =>
    tab.setAttribute("aria-selected", String(tab.dataset.view === name)));
  document.querySelectorAll(".view").forEach((pane) => {
    pane.hidden = pane.dataset.pane !== name;
  });
  window.scrollTo({ top: 0 });  // each document opens at its beginning
}

export function initViews() {
  const tabs = [...document.querySelectorAll(".tabs [role=tab]")];
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => showView(tab.dataset.view));
    tab.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      showView(next.dataset.view);
      next.focus();
    });
  });
}

export function renderStandards() {
  const rules = Object.values(state.standards);
  if (!rules.length) {
    $("#standards-view").innerHTML = `<p class="placeholder">The standards could not be loaded.</p>`;
    return;
  }
  const rows = rules.map((r) => `<tr>
      <td><strong>${r.id}</strong></td>
      <td><strong>${escapeHtml(r.title)}</strong><br><span class="muted">${escapeHtml(r.category)} · Weight ${r.weight}
        ${r.critical ? "· Key rule" : ""}</span></td>
      <td>${escapeHtml(r.preferred)}
        <details class="std-clause"><summary>PayNest's standard clause</summary>
          <blockquote>${escapeHtml(r.standard_clause)}</blockquote></details></td>
      <td>${escapeHtml(r.fallback)}<br><span class="muted">Who can approve: ${escapeHtml(r.approval.fallback)}</span></td>
      <td>${escapeHtml(r.walk_away)}<br><span class="muted">Who can approve: ${escapeHtml(r.approval.walk_away)}</span></td>
    </tr>`).join("");
  $("#standards-view").innerHTML = `
    <p class="table-note">PayNest Contracting Standards ${escapeHtml(state.standardsVersion || "")} (PayNest's contract rules),
      client agreements (sell-side). Positions are stated from PayNest's perspective as Service Provider.</p>
    <div class="table-card"><table class="grid-table">
      <thead><tr><th>Ref.</th><th>Provision</th><th>Ideal</th><th>Can accept</th><th>Never accept</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;
}
