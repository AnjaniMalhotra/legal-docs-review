// Slide 10: the 10 standards as flip cards (front: icon, weight, key rule; back: ideal / accept / never).
// Slide 11: "the model reads, Python decides" — JSON typed by the model, Python's jobs tick off.
const STD_ICON = { P1: "i-scale", P2: "i-shield", P3: "i-bolt", P4: "i-chart", P5: "i-search",
  P6: "i-db", P7: "i-lock", P8: "i-clock", P9: "i-flag", P10: "i-building" };

Demos.standards = {
  init(root) {
    root.innerHTML = `<div class="std-grid">${DATA.standards.map((s) => `
      <button class="std" aria-label="${esc(s.title)}"><div class="std-in">
        <div class="std-face card">
          <div class="std-top"><div class="icon ${s.critical ? "" : "navy"}">${svgIcon(STD_ICON[s.id])}</div><span class="std-id mono">${s.id}</span></div>
          <b>${esc(s.title)}</b>
          <div class="std-w">${"●".repeat(s.weight)}<span>${"●".repeat(5 - s.weight)}</span> <small>weight ${s.weight}</small></div>
          ${s.critical ? `<span class="tag std-key">Key rule</span>` : ""}
        </div>
        <div class="std-back card">
          <div><span class="pill s-ok">Ideal</span><p>${esc(s.ideal)}</p></div>
          <div><span class="pill s-acc">Can accept</span><p>${esc(s.accept)}</p></div>
          <div><span class="pill s-no">Never</span><p>${esc(s.never)}</p></div>
        </div></div></button>`).join("")}</div>
      <div class="std-foot mono">Each standard is one YAML file · weights, red flags, numeric bands, “if silent” rule</div>`;
    $$(".std", root).forEach((b) => (b.onclick = () => b.classList.toggle("flip")));
  },
  enter(root) { $$(".std", root).forEach((b) => b.classList.remove("flip")); },
};

Demos.split = (() => {
  const JSON_TEXT = `{
  "rule_id": "P1",
  "status": "Conflicting",
  "evidence_quote": "…liability for any Data
     Breach shall be unlimited.",
  "page": 6,
  "clause_ref": "15.1 Limitation of Liability"
}`;
  const JOBS = [
    ["i-hash", "“Not found” → Missing or fine", "if_silent"],
    ["i-flag", "Walk-away phrases", "red flags"],
    ["i-shield", "Quote really in the PDF?", "grounding"],
    ["i-clock", "Days · hours · %", "numeric check"],
    ["i-scale", "Score = Σ w·g ÷ Σ w", "scoring"],
    ["i-pause", "Pause for a lawyer", "human gate"],
  ];
  let run = 0;
  return {
    init(root) {
      root.innerHTML = `<div class="split-wrap">
        <div class="card split-side"><div class="split-head"><div class="icon navy">${svgIcon("i-eye")}</div><div><b>The model</b><span>Qwen 2.5 7B · temperature 0</span></div></div>
          <div class="split-allowed">${["Compliant", "Partial", "Conflicting", "Not found", "N/A"].map(pill).join("")}</div>
          <pre class="split-json mono" id="split-json"></pre>
          <div class="split-no mono">✕ never a score · ✕ never “Missing” · ✕ never “Needs review”</div></div>
        <div class="split-mid"><span class="mono">JSON</span><div class="split-arrow"></div></div>
        <div class="card split-side"><div class="split-head"><div class="icon">${svgIcon("i-gear")}</div><div><b>Python</b><span>Same input → same answer, always</span></div></div>
          <div class="split-jobs">${JOBS.map(([i, t, k]) => `<div class="job">${svgIcon(i)}<b>${t}</b><span class="mono">${k}</span><em class="tick">${svgIcon("i-check")}</em></div>`).join("")}</div></div>
      </div>`;
    },
    async enter(root) {
      const me = ++run, pre = $("#split-json", root), jobs = $$(".job", root);
      pre.textContent = ""; jobs.forEach((j) => j.classList.remove("done"));
      await sleep(600);
      for (let i = 0; i <= JSON_TEXT.length; i++) { if (me !== run) return; pre.textContent = JSON_TEXT.slice(0, i); await sleep(12); }
      for (const j of jobs) { if (me !== run) return; await sleep(380); j.classList.add("done"); }
    },
  };
})();
