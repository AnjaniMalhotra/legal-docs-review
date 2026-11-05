// Live demo of the LangGraph human gate: classify → score → ⏸ human_gate → finalize.
// The graph pauses on CareWell's real flagged findings (P1, P3) until the lawyer decides each one;
// decisions go to the audit trail and the score is recomputed with the lawyer's statuses.
Demos.gate = (() => {
  const NODES = [["classify", "i-chip"], ["score", "i-scale"], ["human_gate", "i-pause"], ["finalize", "i-send"]];
  const FLAGGED = [
    { id: "P1", quote: "…liability for any Data Breach shall be unlimited.", alt: "Partial", note: "Client agreed a 24-month breach super-cap" },
    { id: "P3", quote: "…notify the Client immediately upon becoming aware of any Security Incident…", alt: "Partial", note: "Client accepted 24 hours from confirmation" },
  ];
  let root, run = 0, decisions = {};

  function init(el) {
    root = el;
    el.innerHTML = `<div class="gt-wrap">
      <div class="gt-graph">${NODES.map(([n, i], k) => `<div class="gt-node" id="gt-${n}">${svgIcon(i)}<span class="mono">${n}</span></div>${k < 3 ? '<div class="gt-edge"><i></i></div>' : ""}`).join("")}
        <div class="gt-token" id="gt-token"></div></div>
      <div class="gt-body">
        <div class="gt-cards" id="gt-cards"></div>
        <div class="gt-side">
          <div class="card gt-state" id="gt-state"></div>
          <div class="card gt-audit"><div class="mono gr-lab">AUDIT TRAIL</div><div id="gt-audit" class="gt-log"></div></div>
        </div></div></div>`;
  }

  function moveTo(k) {
    const node = $(`#gt-${NODES[k][0]}`, root);
    $("#gt-token", root).style.left = `${node.offsetLeft + node.offsetWidth / 2 - 11}px`;
    $$(".gt-node", root).forEach((n, i) => n.classList.toggle("on", i === k));
  }
  function state(html) { $("#gt-state", root).innerHTML = html; }
  function statuses() {
    const s = {}; DATA.carewellReview.forEach((r) => (s[r.id] = decisions[r.id] || r.final)); return s;
  }

  async function play() {
    const me = ++run; decisions = {};
    $("#gt-cards", root).innerHTML = ""; $("#gt-audit", root).innerHTML = `<span class="muted mono">No decisions yet</span>`;
    $$(".gt-node", root).forEach((n) => n.classList.remove("paused", "done"));
    moveTo(0); state(`<span class="mono">classifying 10 standards…</span>`);
    await sleep(900); if (me !== run) return;
    moveTo(1); const r = computeScore(statuses());
    state(`<div class="rv-num"><b>${r.score}</b><small>/100</small></div>${`<span class="pill ${BAND_CLS[r.band]}">${r.band}</span>`}`);
    await sleep(1000); if (me !== run) return;
    moveTo(2); $("#gt-human_gate", root).classList.add("paused");
    state(`<div class="gate-on">${svgIcon("i-pause")}<div><b>interrupt()</b><span class="mono">state saved to SQLite · waiting for counsel</span></div></div>`);
    $("#gt-cards", root).innerHTML = FLAGGED.map((f) => `<div class="card gt-card" data-id="${f.id}">
      <div class="gt-ch"><b>${f.id}</b> ${esc(rule(f.id).title)} ${pill("Conflicting")}</div>
      <p class="gt-q">${esc(f.quote)}</p>
      <div class="gt-act"><button class="btn" data-a="approve">${svgIcon("i-check")} Approve</button>
        <button class="btn" data-a="override">Override → ${STATUS[f.alt][0]}</button></div></div>`).join("");
    $$(".gt-card", root).forEach((card) => $$("button", card).forEach((b) => (b.onclick = () => decide(card, b.dataset.a, me))));
  }

  async function decide(card, action, me) {
    const f = FLAGGED.find((x) => x.id === card.dataset.id);
    decisions[f.id] = action === "approve" ? "Conflicting" : f.alt;
    card.classList.add("decided");
    $(".gt-act", card).innerHTML = `${pill(decisions[f.id])} <span class="mono muted">${action === "approve" ? "kept" : esc(f.note)}</span>`;
    const t = new Date().toLocaleTimeString([], { hour12: false });
    const log = $("#gt-audit", root); if (log.querySelector(".muted")) log.innerHTML = "";
    log.insertAdjacentHTML("beforeend", `<div><span>${t}</span> Counsel · ${f.id} · Not acceptable → ${STATUS[decisions[f.id]][0]}${action === "override" ? ` · “${esc(f.note)}”` : ""}</div>`);
    if (Object.keys(decisions).length < FLAGGED.length) return;
    await sleep(600); if (me !== run) return;
    $("#gt-human_gate", root).classList.remove("paused"); $("#gt-human_gate", root).classList.add("done");
    moveTo(3); const r = computeScore(statuses());
    state(`<div class="rv-num"><b>${r.score}</b><small>/100</small></div><span class="pill ${BAND_CLS[r.band]}">${r.band}</span>
      <div class="mono muted" style="margin-top:8px">resumed · Issues List built</div>`);
  }

  return { init, enter: play };
})();
