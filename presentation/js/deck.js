// Deck engine: 1600×900 canvas scaled to fit, keyboard/click navigation, overview grid,
// image slots for the sketches, and a REAL counter of resources loaded from outside this machine.
window.Demos = window.Demos || {};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

(function () {
  const deck = $("#deck");
  const slides = $$(".slide");
  const total = slides.length;
  let cur = 0;
  const started = new Set();

  function fit() {
    const s = Math.min(window.innerWidth / 1640, window.innerHeight / 940);
    deck.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  function go(n, push = true) {
    n = Math.max(0, Math.min(total - 1, n));
    slides.forEach((sl, i) => {
      sl.classList.toggle("active", i === n);
      sl.classList.toggle("prev", i < n);
    });
    cur = n;
    const sl = slides[n];
    $("#progress").style.width = `${((n + 1) / total) * 100}%`;
    $("#rail-num").textContent = String(n + 1).padStart(2, "0");
    $("#rail-label").textContent = sl.dataset.label || "";
    $("#count").textContent = `${n + 1} / ${total}`;
    $$(".ov-item").forEach((b, i) => b.classList.toggle("cur", i === n));
    if (push) history.replaceState(null, "", `#${n + 1}`);
    typeOut(sl);
    const name = sl.dataset.demo;
    const demo = name && window.Demos[name];
    if (demo) {
      const root = $(`#${name}`) || sl;
      if (!started.has(name)) { started.add(name); demo.init && demo.init(root); }
      demo.enter && demo.enter(root);
    }
  }

  // Typewriter for elements with data-text (replays each time the slide opens).
  function typeOut(sl) {
    $$(".typed", sl).forEach(async (el) => {
      const text = el.dataset.text, run = (el._run = (el._run || 0) + 1);
      el.textContent = "";
      await sleep(500);
      for (let i = 0; i <= text.length; i++) {
        if (el._run !== run) return;
        el.textContent = text.slice(0, i);
        await sleep(18);
      }
      el.classList.add("done");
    });
  }

  // Overview grid.
  const grid = $("#ov-grid");
  slides.forEach((sl, i) => {
    const b = document.createElement("button");
    b.className = "ov-item";
    b.innerHTML = `<small>${String(i + 1).padStart(2, "0")} · ${esc(sl.dataset.label || "")}</small>
      <span>${esc($("h1, h2", sl).textContent)}</span>`;
    b.onclick = () => { toggleOverview(false); go(i); };
    grid.appendChild(b);
  });
  function toggleOverview(force) { $("#overview").classList.toggle("open", force); }

  // Image slots: show the sketch if the file exists, otherwise a placeholder naming the file and prompt.
  $$(".sketch").forEach((fig) => {
    fig.innerHTML = `<div class="ph"><b>${esc(fig.dataset.prompt)}</b>Drop the image at<br>presentation/${esc(fig.dataset.src)}</div>`;
    const img = new Image();
    img.alt = fig.dataset.prompt;
    img.onload = () => { fig.prepend(img); fig.classList.add("loaded"); };
    img.src = fig.dataset.src;
  });

  // REAL network check: count every resource this page loaded from another machine.
  const local = (u) => {
    try {
      const url = new URL(u, location.href);
      return url.protocol === "file:" || url.protocol === "data:" || url.protocol === "blob:" ||
        url.origin === location.origin || ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    } catch (e) { return true; }
  };
  window.externalRequests = 0;
  const seen = (entries) => entries.forEach((e) => { if (!local(e.name)) window.externalRequests++; });
  seen(performance.getEntriesByType("resource"));
  if (window.PerformanceObserver) new PerformanceObserver((l) => { seen(l.getEntries()); paintNet(); }).observe({ type: "resource", buffered: false });
  function paintNet() {
    $("#net-count").textContent = window.externalRequests;
    $("#netbadge").classList.toggle("bad", window.externalRequests > 0);
    document.dispatchEvent(new CustomEvent("net"));
  }
  paintNet();

  // Controls.
  $("#next").onclick = () => go(cur + 1);
  $("#back").onclick = () => go(cur - 1);
  $("#menu").onclick = () => toggleOverview();
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, textarea, [contenteditable]")) return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (["ArrowLeft", "PageUp"].includes(e.key)) go(cur - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(total - 1);
    else if (e.key.toLowerCase() === "o" || e.key === "Escape") toggleOverview(e.key === "Escape" ? false : undefined);
    else if (e.key.toLowerCase() === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  });
  window.addEventListener("resize", fit);
  window.addEventListener("load", () => {
    fit();
    const start = parseInt(location.hash.slice(1), 10);
    go(Number.isFinite(start) ? start - 1 : 0, false);
  });
  fit();
})();

// Shared helpers for the demos.
const STATUS = {
  Compliant: ["OK", "s-ok"], Partial: ["Acceptable", "s-acc"], Conflicting: ["Not acceptable", "s-no"],
  Missing: ["Missing", "s-miss"], "Silent (OK)": ["Not mentioned (fine)", "s-fine"], "N/A": ["Doesn't apply", "s-na"],
  "Needs review": ["Lawyer's check", "s-rev"], "Not found": ["Not found", "s-fine"],
};
function pill(status) {
  const [label, cls] = STATUS[status] || [status, "s-na"];
  return `<span class="pill ${cls}">${esc(label)}</span>`;
}
function svgIcon(id, cls = "") { return `<svg class="${cls}"><use href="#${id}"/></svg>`; }
