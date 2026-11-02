// Agreement view: the uploaded pages as paper, with each finding's evidence highlighted in its
// severity colour and tagged with the standard reference. Highlights and Review cards link both ways.
import { openIssue } from "./findings.js";
import { showView } from "./views.js";
import { $, escapeHtml, label, sevOf, state } from "./ui.js";

const FOOTER = /^.*page \d+ of \d+.*$/gim;  // running footer extracted from the PDF
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Match the quote word by word, tolerating line breaks and spacing from PDF extraction.
function quoteRegex(quote) {
  const words = quote.replace(/^[\s"'“”]+|[\s"'“”.]+$/g, "").split(/\s+/).filter(Boolean);
  return words.length ? new RegExp(words.map(escapeRe).join("\\s+"), "i") : null;
}

function renderPage(text, pageNo, total, findings) {
  const marks = [];
  for (const f of findings) {
    if (!f.evidence_quote || f.page !== pageNo || f.grounded === false) continue;
    const match = quoteRegex(f.evidence_quote)?.exec(text);
    if (match) marks.push({ start: match.index, end: match.index + match[0].length, f });
  }
  marks.sort((a, b) => a.start - b.start);
  let html = "";
  let pos = 0;
  for (const { start, end, f } of marks) {
    if (start < pos) continue;  // overlapping quotes: keep the first
    html += escapeHtml(text.slice(pos, start));
    html += `<mark class="hl hl-${sevOf(f.status)}" id="hl-${f.rule_id}" data-rule="${f.rule_id}"
      title="${escapeHtml(f.title)}: ${escapeHtml(label(f.status))}">${escapeHtml(text.slice(start, end))}</mark>`;
    pos = end;
  }
  html += escapeHtml(text.slice(pos));
  return `<article class="page" id="page-${pageNo}">
    <span class="page__no">${pageNo} / ${total}</span><p class="page__text">${html}</p></article>`;
}

const LEGEND = `<div class="legend"><span><i class="hl-bad"></i>Not acceptable or missing</span>
  <span><i class="hl-info"></i>Needs a lawyer's check</span><span><i class="hl-warn"></i>Acceptable</span>
  <span><i class="hl-ok"></i>OK</span><span>Select a highlight to see why</span></div>`;

export function renderContract(findings = []) {
  const pages = state.doc.pages.map((p) => p.replace(FOOTER, "").trim());
  const legend = findings.length ? LEGEND : `<div class="legend">Clauses are highlighted once the contract has been checked against PayNest rules.</div>`;
  $("#contract-view").innerHTML = `${legend}<div class="pages">${
    pages.map((text, i) => renderPage(text, i + 1, pages.length, findings)).join("")}</div>`;
}

function flash(el) {
  document.querySelectorAll(".hl.is-active, .page.is-active").forEach((n) => n.classList.remove("is-active"));
  el.classList.add("is-active");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function goToPage(pageNo) {
  showView("agreement");
  const page = document.getElementById(`page-${pageNo}`);
  if (page) flash(page);
}

export function goToRule(ruleId, pageNo) {
  showView("agreement");
  const mark = document.getElementById(`hl-${ruleId}`);
  if (mark) flash(mark);
  else if (pageNo) goToPage(pageNo);
}

export function initContractView() {
  $("#contract-view").addEventListener("click", (e) => {
    const mark = e.target.closest("mark.hl");
    if (!mark) return;
    flash(mark);
    openIssue(mark.dataset.rule);
  });
}
