// Live score calculator — the same arithmetic as app/policy/scoring.py, with the real weights,
// gap factors, bands and floor from settings.yaml. Presets reproduce the golden scores 49/43/3/29/18.
function computeScore(statuses) {
  const S = DATA.scoring;
  let wg = 0, w = 0;
  const rows = DATA.standards.map((r) => {
    const st = statuses[r.id], excluded = S.excluded.includes(st), g = excluded ? null : S.gap[st];
    if (!excluded) { wg += r.weight * g; w += r.weight; }
    return { id: r.id, w: r.weight, st, g, wg: excluded ? null : r.weight * g };
  });
  const score = w ? Math.floor((100 * wg) / w + 0.5) : 0;
  const order = S.bands.map((b) => b.band);
  const raw = (S.bands.find((b) => score <= b.max) || S.bands[S.bands.length - 1]).band;
  const floorRules = DATA.standards.filter((r) => r.critical && S.floor.statuses.includes(statuses[r.id])).map((r) => r.id);
  const band = floorRules.length && order.indexOf(raw) < order.indexOf(S.floor.min_band) ? S.floor.min_band : raw;
  return { score, wg, w, raw, band, floorRules, floored: band !== raw, rows };
}
const BAND_CLS = { Low: "s-ok", Medium: "s-acc", High: "s-no", Critical: "s-miss" };

Demos.score = (() => {
  const CYCLE = ["Compliant", "Partial", "Conflicting", "Missing", "Silent (OK)", "N/A", "Needs review"];
  let root, st = {};

  function paint() {
    const r = computeScore(st);
    r.rows.forEach((row) => {
      const el = $(`.sc-row[data-id="${row.id}"]`, root);
      $(".sc-st", el).innerHTML = pill(row.st);
      $(".sc-g", el).textContent = row.g === null ? "—" : row.g;
      $(".sc-wg", el).textContent = row.wg === null ? "excluded" : row.wg;
      el.classList.toggle("ex", row.g === null);
    });
    $("#sc-num", root).textContent = r.score;
    $("#sc-needle", root).style.left = `${r.score}%`;
    $("#sc-formula", root).innerHTML = `100 × <b>${r.wg}</b> ÷ <b>${r.w}</b> = <b>${r.score}</b>`;
    $("#sc-band", root).innerHTML = `<span class="pill ${BAND_CLS[r.band]}">${r.band} risk</span>` +
      (r.floored ? `<div class="sc-floor">${svgIcon("i-flag")} Floor: ${r.floorRules.join(", ")} failed → at least High (was ${r.raw})</div>` : "");
  }
  function load(id) {
    st = { ...DATA.golden[id].labels };
    $$(".sc-presets .btn", root).forEach((b) => b.classList.toggle("on", b.dataset.id === id));
    $("#sc-exp", root).textContent = `golden answer: ${DATA.golden[id].score} ${DATA.golden[id].band}`;
    paint();
  }
  return {
    init(el) {
      root = el;
      el.innerHTML = `<div class="sc-wrap">
        <div class="card sc-table">
          <div class="sc-row sc-head mono"><span>Standard</span><span>w</span><span>Status (click)</span><span>gap</span><span>w·g</span></div>
          ${DATA.standards.map((s) => `<div class="sc-row" data-id="${s.id}"><span><b>${s.id}</b> ${esc(s.title)}${s.critical ? ' <i class="key">key</i>' : ""}</span>
            <span class="mono">${s.weight}</span><button class="sc-st"></button><span class="mono sc-g"></span><span class="mono sc-wg"></span></div>`).join("")}
        </div>
        <div class="sc-side">
          <div class="sc-presets">${Object.keys(DATA.golden).map((id) => `<button class="btn" data-id="${id}">${id}</button>`).join("")}</div>
          <div class="card sc-out"><div class="rv-num"><b id="sc-num">0</b><small>/100</small></div>
            <div class="meter"><i id="sc-needle"></i></div><div class="meter-scale mono"><span>Low ≤20</span><span>Med ≤45</span><span>High ≤70</span><span>Crit</span></div>
            <div class="sc-formula mono" id="sc-formula"></div><div id="sc-band"></div><div class="mono sc-exp" id="sc-exp"></div></div>
          <div class="sc-legend mono">gap: OK 0 · Acceptable 0.5 · Not acceptable / Missing / Lawyer's check 1 · Doesn't apply: excluded</div>
        </div></div>`;
      $$(".sc-row[data-id]", el).forEach((row) => ($(".sc-st", row).onclick = () => {
        const id = row.dataset.id;
        st[id] = CYCLE[(CYCLE.indexOf(st[id]) + 1) % CYCLE.length];
        $$(".sc-presets .btn", el).forEach((b) => b.classList.remove("on"));
        $("#sc-exp", el).textContent = "edited by you";
        paint();
      }));
      $$(".sc-presets .btn", el).forEach((b) => (b.onclick = () => load(b.dataset.id)));
    },
    enter() { load("carewell"); },
  };
})();
