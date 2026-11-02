// Live demo: the REAL chunker output for CareWell Hospitals (11 pages → 74 clause chunks),
// replayed as pages → clause cards → vectors → Chroma. Hover a card to see its heading.
Demos.ingest = (() => {
  const C = DATA.carewellChunks;
  let root, running = false;

  function init(el) {
    root = el;
    const pages = Array.from({ length: C.pages }, (_, i) =>
      `<div class="ing-page" data-p="${i + 1}"><i></i><i></i><i></i><i></i><i></i><span>${i + 1}</span></div>`).join("");
    el.innerHTML = `<div class="ing-wrap">
      <div class="ing-col"><div class="ing-title">${svgIcon("i-doc")} PDF · ${C.pages} pages</div><div class="ing-pages">${pages}</div>
        <button class="btn primary" id="ing-go">Upload &amp; chunk</button></div>
      <div class="ing-arrow">→</div>
      <div class="ing-col grow"><div class="ing-title">${svgIcon("i-hash")} Clause chunks <b id="ing-n">0</b></div>
        <div class="ing-chunks" id="ing-chunks"></div><div class="ing-tip mono" id="ing-tip">press “Upload &amp; chunk” · then hover a chunk</div></div>
      <div class="ing-arrow">→</div>
      <div class="ing-col"><div class="ing-title">${svgIcon("i-db")} Chroma</div>
        <div class="ing-db"><div class="ing-fill" id="ing-fill"></div><b id="ing-v">0</b><span>vectors</span></div>
        <div class="ing-chips"><span class="chip">≤ 1200 chars</span><span class="chip">150 overlap</span><span class="chip">nomic-embed-text</span><span class="chip">page + heading kept</span></div></div>
    </div>`;
    $("#ing-go", el).onclick = run;
  }

  function reset() {
    $("#ing-chunks", root).innerHTML = "";
    $("#ing-n", root).textContent = "0"; $("#ing-v", root).textContent = "0";
    $("#ing-fill", root).style.height = "0%";
    $$(".ing-page", root).forEach((p) => p.classList.remove("on"));
  }

  async function run() {
    if (running) return;
    running = true; reset();
    const box = $("#ing-chunks", root), tip = $("#ing-tip", root);
    for (let i = 0; i < C.chunks.length; i++) {
      const c = C.chunks[i];
      $$(".ing-page", root).forEach((p) => p.classList.toggle("on", +p.dataset.p === c.p));
      const card = document.createElement("div");
      card.className = "ing-chunk";
      card.style.setProperty("--w", `${Math.max(18, Math.min(100, c.n / 12))}%`);
      card.innerHTML = `<b>${esc(c.h.split(" ")[0])}</b><i></i>`;
      card.onmouseenter = () => (tip.innerHTML = `<b>${esc(c.h)}</b> · p.${c.p} · ${c.n} chars`);
      box.appendChild(card);
      $("#ing-n", root).textContent = i + 1;
      await sleep(i < 8 ? 120 : 28);
      card.classList.add("vec");
      $("#ing-v", root).textContent = i + 1;
      $("#ing-fill", root).style.height = `${((i + 1) / C.chunks.length) * 100}%`;
    }
    $$(".ing-page", root).forEach((p) => p.classList.add("on"));
    tip.innerHTML = `<b>${C.chunks.length} chunks</b> from ${C.pages} pages · every one knows its page and clause`;
    running = false;
  }

  return { init, enter: () => { if (!running) reset(); } };
})();
