// Results slide: real eval results. Closing slide: the five design ideas + the live request counter.
Demos.results = (() => {
  const NAMES = { carewell: "CareWell Hospitals", northstar: "Northstar Bank", lexmore: "Lexmore Associates", brightretail: "BrightRetail Stores", orbit: "Orbit Analytics (pilot)" };
  const STATS = [
    ["76%", "standards judged exactly right", "38 / 50 · target 80%", "amber"],
    ["5 / 5", "risk bands right", "Low · Medium · High", "ok"],
    ["0", "risky clauses marked OK", "the release blocker", "ok"],
    ["6 / 7", "chat answers on the right page", "+ 3 / 3 honest “Not found”", "navy"],
    ["0.89", "Ragas faithfulness", "target 0.85 · judge: Llama 3.1 8B", "navy"],
  ];
  let root;
  return {
    init(el) {
      root = el;
      el.innerHTML = `<div class="res-wrap">
        <div class="card res-chart">
          <div class="res-zones mono"><span>Low</span><span>Medium</span><span>High</span><span>Critical</span></div>
          ${DATA.results.map((r) => `<div class="res-row">
            <span class="res-name"><b>${esc(NAMES[r.id])}</b><small class="mono">${r.exact}/10 exact</small></span>
            <div class="res-track"><i class="res-exp" style="left:${r.expected}%" title="expected ${r.expected}"></i>
              <div class="res-bar ${BAND_CLS[r.band]}" data-w="${r.score}"><b>${r.score}</b></div></div>
            <span class="res-band">${r.band === r.expectedBand ? svgIcon("i-check", "okc") : ""}<span class="pill ${BAND_CLS[r.band]}">${r.band}</span></span>
          </div>`).join("")}
          <div class="res-key mono"><i class="res-exp-key"></i> expected score · bar = actual</div>
        </div>
        <div class="res-stats">${STATS.map(([n, l, s, c]) => `<div class="card res-stat ${c}"><b>${n}</b><span>${l}</span><small class="mono">${s}</small></div>`).join("")}</div>
      </div>
      <div class="note res-note">Tuned on these same 5 contracts, so expect lower on a new client's paper. Next: a held-out set, run once.</div>`;
    },
    async enter() {
      $$(".res-bar", root).forEach((b) => (b.style.width = "0%"));
      await sleep(300);
      $$(".res-bar", root).forEach((b, i) => setTimeout(() => (b.style.width = `${Math.max(b.dataset.w, 4)}%`), i * 160));
    },
  };
})();

Demos.close = (() => {
  let root;
  const paint = () => { if (root) $("#cl-n", root).textContent = window.externalRequests; };
  return {
    init(el) {
      root = el;
      el.innerHTML = `<div class="cl-wrap">
        <div class="cl-next reveal">
          <div class="card cl-item"><div class="icon">${svgIcon("i-lock")}</div><b>Nothing leaves the machine</b><span>Local models, vectors and traces</span></div>
          <div class="card cl-item"><div class="icon navy">${svgIcon("i-route")}</div><b>Ask for a role, not a model</b><span>analyst · judge · embed, mapped in config</span></div>
          <div class="card cl-item"><div class="icon navy">${svgIcon("i-gear")}</div><b>The model reads, Python decides</b><span>Labels from the AI, scores from code</span></div>
          <div class="card cl-item"><div class="icon ok">${svgIcon("i-shield")}</div><b>Every claim quotes the contract</b><span>No verbatim quote, no verdict</span></div>
          <div class="card cl-item"><div class="icon amber">${svgIcon("i-pen")}</div><b>A human signs off on risk</b><span>The workflow pauses for a lawyer</span></div>
        </div>
        <div class="card cl-counter"><span class="live">Live · measured by this browser</span>
          <div class="cl-big"><b id="cl-n">0</b><span>external requests made<br>by this whole presentation</span></div>
          <div class="stamp ok cl-stamp">Nothing left the building</div></div>
      </div>`;
      document.addEventListener("net", paint);
    },
    enter() { paint(); const s = $(".cl-stamp", root); s.classList.remove("drop"); void s.offsetWidth; s.classList.add("drop"); },
  };
})();
