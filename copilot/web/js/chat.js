// Floating contract assistant (bottom-right). Citations like [p.9, 14.1 …] become
// clickable chips that open that page in the contract viewer.
import { ask } from "./api.js";
import { goToPage } from "./document_view.js";
import { $, escapeHtml, state } from "./ui.js";

// Any [...] that names a page: "[p.9, 14.1 …]", "[11, 16.1 …]" or "[16.1, p.11, …]".
const BRACKETS = /\[([^\]]{1,160})\]/g;
const pageIn = (inner) => (inner.match(/\bp\.\s?(\d+)/i) || inner.match(/^\s*(\d+)\s*,/))?.[1];
const linkCitations = (safe) => safe.replace(BRACKETS, (whole, inner) => {
  const page = pageIn(inner);
  return page ? `<button class="cite" data-page="${page}">${inner.trim()}</button>` : whole;
});

function addMessage(kind, text) {
  const log = $("#chat-log");
  const msg = document.createElement("div");
  msg.className = `msg msg--${kind}`;
  const safe = escapeHtml(text);
  msg.innerHTML = kind === "bot" ? linkCitations(safe) : safe;
  log.appendChild(msg);
  log.scrollTop = log.scrollHeight;
  return msg;
}

function setOpen(open) {
  $("#chat-panel").hidden = !open;
  $("#chat-launcher").hidden = open;
  $("#chat-launcher").setAttribute("aria-expanded", String(open));
  if (open) $("#chat-input").focus();
}

async function send(question) {
  if (!question || !state.docId) return;
  $("#chat-input").value = "";
  $(".chat-hint")?.remove();
  addMessage("user", question);
  const pending = addMessage("pending", "Searching the agreement…");
  $("#chat-send").disabled = true;
  try {
    const res = await ask(state.docId, question);
    pending.remove();
    addMessage("bot", res.answer);
  } catch (err) {
    pending.remove();
    addMessage("error", err.message);
  } finally {
    $("#chat-send").disabled = false;
    $("#chat-input").focus();
  }
}

export function enableChat() {
  $("#chat-launcher").hidden = false;
}

export function initChat() {
  $("#chat-launcher").addEventListener("click", () => setOpen(true));
  $("#chat-close").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#chat-panel").hidden) setOpen(false); });
  $("#chat-form").addEventListener("submit", (e) => { e.preventDefault(); send($("#chat-input").value.trim()); });
  $("#chat-log").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) return send(chip.dataset.q);
    const cite = e.target.closest(".cite");
    if (cite) goToPage(Number(cite.dataset.page));
  });
}
