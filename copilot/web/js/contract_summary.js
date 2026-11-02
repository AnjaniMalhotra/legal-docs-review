// Summary tab: plain-English key terms of the agreement, each with the clauses relied on.
// Generated once per document on the server and cached; sources link to the page in the Agreement tab.
import { getSummary } from "./api.js";
import { goToPage } from "./document_view.js";
import { $, escapeHtml, state } from "./ui.js";

function sources(list) {
  return list.map((s) => `<button class="source" type="button" data-page="${s.page}">
    ${escapeHtml(s.clause || "Provision")}, p.${s.page}</button>`).join("");
}

function render(summary) {
  const rows = summary.sections.map((s) => `
    <dt>${escapeHtml(s.name)}</dt>
    <dd>${escapeHtml(s.summary)}<div class="sources">${sources(s.sources)}</div></dd>`).join("");
  $("#summary-view").innerHTML = `
    <article class="summary-doc">
      <p class="eyebrow">Summary of key terms</p>
      <p class="summary-doc__overview">${escapeHtml(summary.overview)}</p>
      <dl class="terms">${rows}</dl>
      <p class="summary-doc__note">Prepared from the agreement text for orientation only. Rely on the cited clauses,
        and see the Review tab for the assessment against the Contracting Standards.</p>
    </article>`;
}

export async function loadSummary() {
  const box = $("#summary-view");
  box.innerHTML = `<p class="placeholder"><span class="status is-busy">Preparing a summary of the key terms…</span></p>`;
  try {
    render(await getSummary(state.docId));
  } catch (err) {
    box.innerHTML = `<p class="placeholder">${escapeHtml(err.message)}
      <br><button class="link-btn" type="button" id="retry-summary">Try again</button></p>`;
    $("#retry-summary").addEventListener("click", loadSummary);
  }
}

export function initSummary() {
  $("#summary-view").addEventListener("click", (e) => {
    const src = e.target.closest(".source");
    if (src) goToPage(Number(src.dataset.page));
  });
}
