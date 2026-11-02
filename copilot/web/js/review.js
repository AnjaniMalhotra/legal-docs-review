// Counsel approval: decision controls on escalated provisions and submission of decisions.
import { submitDecisions } from "./api.js";
import { $, STATUS_LABEL, escapeHtml, setStatus, state } from "./ui.js";

// Statuses a lawyer may set ("Needs a lawyer's check" is set by the system only).
const RECLASSIFY = ["Compliant", "Partial", "Conflicting", "Missing", "Silent (OK)", "N/A"];

export function decisionControls(finding) {
  const options = RECLASSIFY.filter((s) => s !== finding.status)
    .map((s) => `<option value="${escapeHtml(s)}">${escapeHtml(STATUS_LABEL[s])}</option>`).join("");
  return `
    <div class="decision" data-decision="${finding.rule_id}">
      <p>Your decision</p>
      <select data-field="action" aria-label="Decision for ${finding.rule_id}">
        <option value="approve">Agree with this</option>
        <option value="override">Change the status</option>
        <option value="note">Just add a note</option>
      </select>
      <select data-field="new_status" aria-label="New status" hidden>${options}</select>
      <input data-field="note" type="text" placeholder="Why are you changing it? (required)" maxlength="300">
    </div>`;
}

function collect() {
  return [...document.querySelectorAll("[data-decision]")].map((box) => {
    const get = (field) => box.querySelector(`[data-field="${field}"]`);
    const action = get("action").value;
    return {
      rule_id: box.dataset.decision,
      action,
      new_status: action === "override" ? get("new_status").value : null,
      note: get("note").value.trim() || null,
    };
  });
}

export function initReview(onFinal) {
  // Show the status picker only when "Change the status" is chosen.
  $("#findings").addEventListener("change", (e) => {
    if (e.target.dataset.field !== "action") return;
    e.target.parentElement.querySelector('[data-field="new_status"]').hidden = e.target.value !== "override";
  });

  $("#submit-decisions").addEventListener("click", async (e) => {
    const decisions = collect();
    const status = $("#check-status");
    const missingNote = decisions.find((d) => d.action === "override" && !d.note);
    if (missingNote) {
      setStatus(status, `Say why you are changing the status of ${missingNote.rule_id}.`, "error");
      document.getElementById(`issue-${missingNote.rule_id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    e.target.disabled = true;
    setStatus(status, "Recording decisions and recalculating the risk rating…", "busy");
    try {
      state.review = await submitDecisions(state.review.review_id, decisions);
      setStatus(status, "");
      onFinal();
    } catch (err) {
      setStatus(status, err.message, "error");
    } finally {
      e.target.disabled = false;
    }
  });
}
