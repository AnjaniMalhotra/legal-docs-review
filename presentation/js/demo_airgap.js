// Live demo: packets travel the real routes (browser → app → Bifrost → Ollama, Chroma, Langfuse).
// A request for a model that is not on Bifrost's allowlist is refused AT the gateway — the same
// "no keys found that support model" error we got when testing the real gateway.
Demos.airgap = (() => {
  const N = {
    browser: [40, 215, 130, 90, "Browser", "i-user"], app: [230, 195, 170, 130, "App · LangGraph", "i-gear"],
    chroma: [245, 420, 140, 86, "Chroma", "i-db"], bifrost: [475, 195, 130, 130, "Bifrost", "i-route"],
    langfuse: [475, 420, 130, 86, "Langfuse", "i-eye"], ollama: [650, 170, 140, 180, "Ollama", "i-chip"],
  };
  const P = {
    in: [[170, 260], [230, 260]], chroma: [[315, 325], [315, 420]], gw: [[400, 260], [475, 260]],
    model: [[605, 260], [650, 260]], trace: [[400, 300], [440, 300], [440, 463], [475, 463]],
    gwtrace: [[540, 325], [540, 420]], out: [[540, 195], [540, 120], [930, 120]],
  };
  let svg, log, stats, busy = false, inside = 0;

  function node(k) {
    const [x, y, w, h, label, icon] = N[k];
    const models = k === "ollama" ? `<text x="${x + 70}" y="${y + 112}" class="ag-sub">qwen2.5 7b</text>
      <text x="${x + 70}" y="${y + 134}" class="ag-sub">llama3.1 8b</text><text x="${x + 70}" y="${y + 156}" class="ag-sub">nomic-embed</text>` : "";
    return `<g class="ag-node" id="ag-${k}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16"/>
      <use href="#${icon}" x="${x + w / 2 - 16}" y="${y + 14}" width="32" height="32" class="ag-ico"/>
      <text x="${x + w / 2}" y="${y + 70}" class="ag-label">${label}</text>${models}</g>`;
  }
  const line = (pts, cls = "") => `<polyline class="ag-path ${cls}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;

  function init(root) {
    root.innerHTML = `<div class="ag-wrap">
      <svg class="ag-svg" viewBox="0 0 1000 560">
        <rect x="12" y="12" width="830" height="530" rx="22" class="ag-machine"/>
        <text x="34" y="44" class="ag-zone">PAYNEST MACHINE · NO INTERNET AFTER SETUP</text>
        <rect x="455" y="150" width="170" height="375" rx="16" class="ag-docker"/>
        <text x="466" y="172" class="ag-zone ag-dz">DOCKER</text>
        ${Object.values(P).map((p, i) => line(p, i === 6 ? "ag-blocked" : "")).join("")}
        ${Object.keys(N).map(node).join("")}
        <g class="ag-cloud"><use href="#i-cloud" x="895" y="70" width="90" height="90"/><text x="940" y="180" class="ag-label">Internet</text></g>
        <g id="ag-wall"><line x1="862" y1="40" x2="862" y2="520" class="ag-wall"/></g>
        <g id="ag-x" class="ag-x"><circle cx="540" cy="160" r="22"/><path d="M530 150l20 20M550 150l-20 20"/></g>
        <g id="ag-packets"></g>
      </svg>
      <div class="ag-side">
        <div class="ag-btns">
          <button class="btn" data-run="upload">${svgIcon("i-doc")} Upload a contract</button>
          <button class="btn" data-run="ask">${svgIcon("i-chat")} Ask a question</button>
          <button class="btn" data-run="review">${svgIcon("i-scale")} Run the review</button>
          <button class="btn seal" data-run="cloud">${svgIcon("i-cloud")} Try a cloud model</button>
        </div>
        <div class="ag-stats card" id="ag-stats"></div>
        <div class="ag-log" id="ag-log"></div>
      </div></div>`;
    svg = $(".ag-svg", root); log = $("#ag-log", root); stats = $("#ag-stats", root);
    $$("[data-run]", root).forEach((b) => (b.onclick = () => run(b.dataset.run, root)));
    write("ready · pick an action above", "ok");
    document.addEventListener("net", paint);
    paint();
  }

  function paint() {
    if (!stats) return;
    stats.innerHTML = `<div><b>${inside}</b><span>packets inside</span></div>
      <div class="ok"><b>0</b><span>packets out</span></div>
      <div class="${window.externalRequests ? "bad" : "ok"}"><b>${window.externalRequests}</b><span>real external<br>requests (this page)</span></div>`;
  }

  function write(text, cls = "") {
    const t = new Date().toLocaleTimeString([], { hour12: false });
    log.insertAdjacentHTML("afterbegin", `<div class="${cls}"><span>${t}</span>${text}</div>`);
    while (log.children.length > 9) log.lastChild.remove();
  }

  function travel(pts, color = "var(--navy)", ms = 520, back = false) {
    const path = back ? [...pts].reverse() : pts;
    const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
    const len = seg.reduce((a, b) => a + b, 0);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("r", 9); dot.setAttribute("class", "ag-dot"); dot.style.fill = color;
    $("#ag-packets", svg).appendChild(dot);
    inside++; paint();
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function frame(now) {
        let d = Math.min(1, (now - t0) / ms) * len, i = 0;
        while (i < seg.length - 1 && d > seg[i]) d -= seg[i++];
        const f = seg[i] ? d / seg[i] : 1, a = path[i], b = path[i + 1];
        dot.setAttribute("cx", a[0] + (b[0] - a[0]) * f); dot.setAttribute("cy", a[1] + (b[1] - a[1]) * f);
        if (now - t0 < ms) requestAnimationFrame(frame); else { dot.remove(); resolve(); }
      })(t0);
    });
  }
  const flash = (k, cls = "hot") => { const g = $(`#ag-${k}`, svg); g.classList.add(cls); setTimeout(() => g.classList.remove(cls), 700); };
  async function model(name, role) {
    await travel(P.gw); flash("bifrost");
    write(`bifrost → <b>${name}</b> <i>(${role})</i> ✓ allowed`);
    await travel(P.model); flash("ollama");
    await travel(P.model, "var(--ok)", 420, true); await travel(P.gw, "var(--ok)", 420, true);
    travel(P.gwtrace, "var(--amber)", 400);
  }

  const RUNS = {
    async upload() {
      write("POST /api/documents · 11-page PDF");
      await travel(P.in); flash("app");
      write("chunker → 1200-char clauses, page + heading");
      await model("nomic-embed-text", "embed");
      await travel(P.chroma); flash("chroma"); write("chroma ← clause vectors stored on disk");
      await travel(P.trace, "var(--amber)"); write("langfuse ← trace (local)", "ok");
    },
    async ask() {
      write("POST /api/ask · “What is our liability for a breach?”");
      await travel(P.in); await model("nomic-embed-text", "embed");
      await travel(P.chroma); flash("chroma"); await travel(P.chroma, "var(--ok)", 400, true);
      write("retriever → top 5 clauses (hybrid)");
      await model("qwen2.5:7b-instruct", "analyst");
      await travel(P.in, "var(--ok)", 450, true); write("answer cites [p.6, 15.1]", "ok");
      travel(P.trace, "var(--amber)");
    },
    async review() {
      write("POST /api/policy/reviews · 10 standards");
      await travel(P.in);
      for (const id of ["P1", "P2", "P3"]) {
        await travel(P.chroma); await model("qwen2.5:7b-instruct", "analyst"); write(`${id} classified · quote verified in PDF`);
      }
      write("… P4–P10 · score 54 High · paused for lawyer", "ok");
      travel(P.trace, "var(--amber)");
    },
    async cloud() {
      write("request: model <b>gpt-oss:120b-cloud</b>", "bad");
      await travel(P.in); await travel(P.gw, "var(--seal)");
      flash("bifrost", "deny"); $("#ag-x", svg).classList.add("on");
      write("bifrost ✕ <b>no keys found that support model</b> — refused", "bad");
      write("nothing left the machine · packets out: 0", "ok");
      setTimeout(() => $("#ag-x", svg).classList.remove("on"), 1600);
    },
  };

  async function run(name, root) {
    if (busy) return;
    busy = true; $$("[data-run]", root).forEach((b) => (b.disabled = true));
    try { await RUNS[name](); } finally { busy = false; $$("[data-run]", root).forEach((b) => (b.disabled = false)); }
  }

  return { init, enter: () => { inside = 0; paint(); } };
})();
