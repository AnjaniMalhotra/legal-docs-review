// Risk rating: the panel at the top of the Review tab and the compact chip in the matter header.
import { $, escapeHtml, slug, state } from "./ui.js";

export function renderSummary() {
  const review = state.review;
  const final = review.state === "final";
  const result = final ? review.report.final_result : review.system_result;
  const system = final ? review.report.system_result : null;

  const floor = result.floor_applied
    ? `<p class="score-note is-alert">Raised to ${escapeHtml(result.band)} because a key rule failed (${result.floor_rules.join(", ")}).</p>`
    : "";
  const change = system && system.score !== result.score
    ? `<p class="score-note">Before the lawyer's decisions: ${system.score} (${escapeHtml(system.band)}).</p>` : "";

  $("#risk-summary").innerHTML = `
    <p class="eyebrow">Risk rating</p>
    <div class="score">
      <div class="score__num">${result.score}<small> / 100</small></div>
      <div class="score__state"><span class="band b-${slug(result.band)}">${escapeHtml(result.band)}</span><br>
        ${final ? "Approved" : "Not yet approved"}</div>
    </div>
    <div class="meter" role="img" aria-label="Risk score ${result.score} of 100"><i style="left:${result.score}%"></i></div>
    <div class="meter-scale"><span>Low</span><span>Medium</span><span>High</span><span>Critical</span></div>
    ${floor}${change}
    ${final ? `<p class="headline">${escapeHtml(review.report.headline)}</p>` : ""}`;

  const chip = $("#risk-chip");
  chip.className = `band b-${slug(result.band)}`;
  chip.textContent = `${result.band} risk · ${result.score}`;
  chip.hidden = false;
}
