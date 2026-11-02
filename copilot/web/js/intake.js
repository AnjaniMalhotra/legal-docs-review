// Intake screen: matter details (counterparty, agreement type, reference, counsel), the matter header,
// and uploading the counterparty's draft, then loading its page text.
import { getDocument, uploadPdf } from "./api.js";
import { $, reviewerName, setStatus, state } from "./ui.js";

export function readMatter() {
  return {
    counterparty: $("#m-counterparty").value.trim(),
    agreement_type: $("#m-type").value,
    reference: $("#m-ref").value.trim(),
  };
}

export function renderMatterHeader() {
  const m = (state.matter = readMatter());
  $("#counsel-name").textContent = reviewerName();
  $("#matter-ref").textContent = [m.reference, m.agreement_type].filter(Boolean).join("  ·  ");
  $("#matter-title").textContent = m.counterparty || "Untitled counterparty";
  const parts = [state.doc?.file_name, state.doc && `${state.doc.pages.length} pages`,
    state.standardsVersion && `Reviewed against Contracting Standards ${state.standardsVersion}`];
  $("#matter-meta").textContent = parts.filter(Boolean).join("  ·  ");
}

export function initIntake() {
  // A matter reference in the legal team's format; counsel may overwrite it.
  $("#m-ref").value = `MAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  ["#m-counterparty", "#m-type", "#m-ref", "#reviewer"].forEach((sel) =>
    $(sel).addEventListener("input", renderMatterHeader));
  renderMatterHeader();
}

export function initUpload(onReady) {
  const zone = $("#dropzone");
  const input = $("#file-input");
  const status = $("#upload-status");

  async function handle(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setStatus(status, "Only PDF documents can be reviewed.", "error");
      return;
    }
    if (reviewerName().length < 2) {
      setStatus(status, "Enter the assigned counsel before uploading.", "error");
      $("#reviewer").focus();
      return;
    }
    setStatus(status, `Processing ${file.name}: extracting text and indexing provisions…`, "busy");
    try {
      const info = await uploadPdf(file);
      state.docId = info.doc_id;
      state.doc = await getDocument(info.doc_id);
      state.review = null;
      setStatus(status, "");
      onReady();
    } catch (err) {
      setStatus(status, err.message, "error");
    } finally {
      input.value = "";
    }
  }

  input.addEventListener("change", () => handle(input.files[0]));
  ["dragenter", "dragover"].forEach((evt) =>
    zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add("is-over"); }));
  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove("is-over"); }));
  zone.addEventListener("drop", (e) => handle(e.dataTransfer.files[0]));
}
