// Entry point. Flow: intake screen -> workspace (Summary first) -> standards review -> counsel approval
// -> Issues List. One tab bar; the workflow stage is shown as a badge in the matter header.
import { getHealth, getStandards, startReview } from "./api.js";
import { enableChat, initChat } from "./chat.js";
import { initSummary, loadSummary } from "./contract_summary.js";
import { initContractView, renderContract } from "./document_view.js";
import { initFindings, renderFindings, resetFilter } from "./findings.js";
import { initIntake, initUpload, readMatter, renderMatterHeader } from "./intake.js";
import { renderAudit, renderIssuesList } from "./issues_list.js";
import { initReview } from "./review.js";
import { renderSummary } from "./risk_rating.js";
import { $, currentFindings, persistReviewer, reviewerName, setStatus, setWorkflow, sevOf, state } from "./ui.js";
import { initViews, renderStandards, showView } from "./views.js";

function renderAll() {
  $("#review-empty").hidden = true;
  $("#review-result").hidden = false;
  $("#run-check").hidden = true;
  renderSummary();
  renderFindings();
  renderContract(currentFindings());
  renderIssuesList();
  renderAudit();
  $("#review-count").textContent = currentFindings().filter((f) => sevOf(f.status) === "bad").length || "";
  const r = state.review;
  setWorkflow(r.state !== "final" ? "approval" : r.report.audit.length ? "approved" : "cleared");
}

function openWorkspace() {
  $("#intake-screen").hidden = true;
  $("#workspace").hidden = false;
  $("#new-review").hidden = false;
  renderMatterHeader();
  renderContract([]);
  renderIssuesList();
  renderAudit();
  enableChat();
  setWorkflow("received");
  showView("summary");
  loadSummary();
}

async function runReview() {
  const status = $("#check-status");
  $("#run-check").disabled = true;
  setWorkflow("review");
  setStatus(status, "Analysing the agreement against the 10 Contracting Standards. This may take a few minutes.", "busy");
  try {
    state.review = await startReview(state.docId, reviewerName(), readMatter());
    setStatus(status, "");
    resetFilter();
    renderAll();
    showView("review");
  } catch (err) {
    setWorkflow("received");
    setStatus(status, err.message, "error");
  } finally {
    $("#run-check").disabled = false;
  }
}

function exportReport() {
  if (!state.review) return;
  const data = state.review.report || state.review;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  link.download = `${state.matter.reference || state.review.review_id}_review.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

document.addEventListener("DOMContentLoaded", async () => {
  persistReviewer();
  initIntake();
  initViews();
  initUpload(openWorkspace);
  initSummary();
  initContractView();
  initFindings();
  initReview(() => { renderAll(); showView("issues"); });
  initChat();
  $("#run-check").addEventListener("click", runReview);
  $("#export").addEventListener("click", exportReport);
  $("#print").addEventListener("click", () => window.print());
  $("#new-review").addEventListener("click", () => window.location.reload());
  try {
    state.standardsVersion = (await getHealth()).standards_version;
    state.standards = Object.fromEntries((await getStandards()).map((r) => [r.id, r]));
  } catch { /* the review still works; the Standards view shows an error */ }
  renderStandards();
  renderMatterHeader();
});
