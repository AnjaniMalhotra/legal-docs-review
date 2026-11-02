// Live replay of a REAL review (CareWell Hospitals, eval run 2026-10-31): what the model said,
// what Python's checks did (P4: numeric check corrected 99.9% uptime), and the final score.
Demos.review = (() => {
  const R = DATA.carewellReview;
  const title = (id) => DATA.standards.find((s) => s.id === id).title;
  let root, run = 0;

  function init(el) {
    root = el;
    el.innerHTML = `<div class="rv-wrap">
      <div class="rv-table card">
        <div class="rv-row rv-headrow mono"><span>Standard</span><span>Model said</span><span>Python checks</span><span>Verdict</span></div>
        ${R.map((r) => `<div class="rv-row" data-id="${r.id}">
          <span class="rv-std"><span class="rv-ico">${svgIcon(STD_ICON[r.id])}</span><b>${r.id}</b> ${esc(title(r.id))}</span>
          <span class="rv-llm"></span><span class="rv-chk"></span><span class="rv-fin"></span>
          <div class="rv-reason">${esc(r.reason)}</div></div>`).join("")}
      </div>
      <div class="rv-side">
        <button class="btn seal rv-go" id="rv-go">${svgIcon("i-bolt")} Run review</button>
        <div class="card rv-score"><div class="mono rv-lab">RISK SCORE</div><div class="rv-num"><b id="rv-num">0</b><small>/100</small></div>
          <div class="meter"><i id="rv-needle"></i></div><div class="meter-scale mono"><span>Low</span><span>Med</span><span>High</span><span>Crit</span></div>
          <div id="rv-band" class="rv-band"></div></div>
        <div class="card rv-gate" id="rv-gate"></div>
        <div class="rv-note mono">Real run · expected 49 High · got ${DATA.carewellScore} High · 9/10 exact<br>click a row for the model's reason</div>
      </div></div>`;
    $("#rv-go", el).onclick = play;
    $$(".rv-row[data-id]", el).forEach((row) => (row.onclick = () => row.classList.toggle("open")));
  }

  function reset() {
    $$(".rv-row[data-id]", root).forEach((row) => {
      row.classList.remove("busy", "done", "open");
      $(".rv-llm", row).innerHTML = $(".rv-chk", row).innerHTML = $(".rv-fin", row).innerHTML = "";
    });
    $("#rv-num", root).textContent = "0"; $("#rv-needle", root).style.left = "0%";
    $("#rv-band", root).innerHTML = ""; $("#rv-gate", root).innerHTML = `<span class="mono muted">Waiting for the review…</span>`;
  }

  async function play() {
    const me = ++run; reset();
    $("#rv-go", root).disabled = true;
    for (const r of R) {
      if (me !== run) return;
      const row = $(`.rv-row[data-id="${r.id}"]`, root);
      row.classList.add("busy");
      $(".rv-llm", row).innerHTML = `<span class="mono muted">retrieving 6 clauses…</span>`;
      await sleep(420);
      $(".rv-llm", row).innerHTML = pill(r.llm);
      await sleep(260);
      const fixed = r.llm !== r.final;
      $(".rv-chk", row).innerHTML = `<span class="chk ok">${svgIcon("i-check")}quote in PDF</span>` +
        (fixed ? `<span class="chk warn">${svgIcon("i-clock")}99.9% → stricter</span>` : "");
      if (fixed) $(".rv-llm .pill", row).classList.add("struck");
      await sleep(fixed ? 700 : 220);
      $(".rv-fin", row).innerHTML = pill(r.final) + (r.final !== r.expected ? `<small class="miss mono">expected ${STATUS[r.expected][0]}</small>` : "");
      row.classList.remove("busy"); row.classList.add("done");
    }
    await countTo(DATA.carewellScore, me);
    if (me !== run) return;
    $("#rv-band", root).innerHTML = `<span class="pill s-no">High risk</span>`;
    $("#rv-gate", root).innerHTML = `<div class="gate-on">${svgIcon("i-pause")}<div><b>Paused for a lawyer</b>
      <span class="mono">Band is High · P1 Not acceptable · P3 Not acceptable</span></div></div>`;
    $("#rv-go", root).disabled = false;
  }

  async function countTo(target, me) {
    for (let v = 0; v <= target; v++) {
      if (me !== run) return;
      $("#rv-num", root).textContent = v;
      $("#rv-needle", root).style.left = `${v}%`;
      await sleep(16);
    }
  }

  return { init, enter: () => { run++; reset(); $("#rv-go", root).disabled = false; } };
})();
