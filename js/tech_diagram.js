// Draws the hand-drawn flow diagrams on the technical slides from simple lists of boxes and arrows.
// The wobble is an SVG filter and the shading an SVG pattern, so nothing is downloaded.
const TECH = (() => {
  const W = 1348, H = 644;
  const COLORS = { paper: "#c9c2b3", red: "#e0634f", navy: "#5c74d6", green: "#3fae72", amber: "#e0a01e", pink: "#d97fb2" };

  document.body.insertAdjacentHTML("afterbegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="t-wobble" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="7"/>
      <feDisplacementMap in="SourceGraphic" scale="5"/></filter>
    ${Object.entries(COLORS).map(([name, color]) => `<pattern id="t-hatch-${name}" width="11" height="11"
      patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="11" stroke="${color}" stroke-width="2" opacity=".55"/></pattern>`).join("")}
    ${[["ink", "#1c1a2b"], ["red", "#cf2f1d"], ["green", "#18733f"], ["amber", "#cf8306"]].map(([name, color]) =>
      `<marker id="t-arrow-${name}" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="17" markerHeight="17"
        markerUnits="userSpaceOnUse" orient="auto"><path d="M1 1 L11 6 L1 11" fill="none" stroke="${color}"
        stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></marker>`).join("")}
  </defs></svg>`);

  const center = (n) => [n.x + n.w / 2, n.y + n.h / 2];

  // The point where a line from the box's centre towards (tx, ty) leaves the box.
  function exitPoint(n, tx, ty) {
    const [cx, cy] = center(n), dx = tx - cx, dy = ty - cy;
    const scale = Math.min(Math.abs((n.w / 2 + 8) / (dx || 1e-6)), Math.abs((n.h / 2 + 8) / (dy || 1e-6)));
    return [cx + dx * scale, cy + dy * scale];
  }

  function wrap(text, maxChars) {
    const lines = [];
    for (const word of String(text).split(" ")) {
      const last = lines[lines.length - 1];
      if (last !== undefined && (`${last} ${word}`).length <= maxChars) lines[lines.length - 1] = `${last} ${word}`;
      else lines.push(word);
    }
    return lines;
  }

  function textLines(lines, x, y, cls, gap, anchor = "middle") {
    return lines.map((line, i) => `<text x="${x}" y="${y + i * gap}" text-anchor="${anchor}" class="${cls}">${esc(line)}</text>`).join("");
  }

  // Tool names use their real logo (saved in images/logos, never fetched); everything else a drawn icon.
  function art(icon, x, y, size) {
    if (!icon.includes(".")) return `<use href="#${icon}" x="${x}" y="${y}" width="${size}" height="${size}" class="t-icon"/>`;
    return `<image href="images/logos/${icon}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  function shape(n, color) {
    if (n.diamond) {
      const [cx, cy] = center(n), points = `${cx},${n.y} ${n.x + n.w},${cy} ${cx},${n.y + n.h} ${n.x},${cy}`;
      return `<polygon points="${points}" class="fill-${color}"/><polygon points="${points}" fill="url(#t-hatch-${color})"/>
        <polygon points="${points}" class="t-line"/>`;
    }
    const box = `x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="20"`;
    return `<rect ${box} class="fill-${color}"/><rect ${box} fill="url(#t-hatch-${color})"/>
      <rect ${box} class="t-line"/><rect x="${n.x + 3}" y="${n.y - 2}" width="${n.w - 5}" height="${n.h + 3}" rx="22" class="t-line soft"/>`;
  }

  function box(n) {
    const color = n.color || "paper";
    const room = n.row ? n.w - (n.icon ? Math.min(n.h * .62, 84) + 44 : 34) : n.w - 26;     // width left for text
    const labels = wrap(n.label, n.chars || Math.max(6, Math.floor(room / 13.5)));
    const subs = n.sub ? wrap(n.sub, n.subChars || Math.max(8, Math.floor(room / 9))) : [];
    let inner;
    if (n.row) {
      const size = n.icon ? Math.min(n.h * .62, 84) : 0, textX = n.x + (n.icon ? size + 30 : 20);
      const total = labels.length * 29 + subs.length * 22, top = n.y + (n.h - total) / 2 + 22;
      inner = (n.icon ? art(n.icon, n.x + 16, n.y + (n.h - size) / 2, size) : "") +
        textLines(labels, textX, top, "t-label", 29, "start") + textLines(subs, textX, top + labels.length * 27, "t-sub", 22, "start");
    } else {
      const textHeight = labels.length * 29 + subs.length * 22;
      const size = n.icon ? Math.min(n.iconSize || 92, n.h - textHeight - 26, n.w - 30) : 0;
      const [cx] = center(n), top = n.y + (n.h - size - textHeight - 6) / 2;
      const labelY = top + size + 28;
      inner = (n.icon ? art(n.icon, cx - size / 2, top, size) : "") +
        textLines(labels, cx, labelY, "t-label", 29) + textLines(subs, cx, labelY + (labels.length - 1) * 29 + 25, "t-sub", 22);
    }
    const cross = n.cross ? (() => { const cx = center(n)[0], cy = n.y + n.h * .38, r = Math.min(n.w, n.h) * .26;
      return `<path d="M${cx - r} ${cy - r} L${cx + r} ${cy + r} M${cx + r} ${cy - r} L${cx - r} ${cy + r}" class="t-cross"/>`; })() : "";
    return `<g filter="url(#t-wobble)">${shape(n, color)}</g>${inner}${cross}`;
  }

  function edge([from, to, opts = {}], nodes, index) {
    const a = nodes[from], b = nodes[to], [bx, by] = center(b), [ax, ay] = center(a);
    const [x1, y1] = exitPoint(a, bx, by), [x2, y2] = exitPoint(b, ax, ay);
    const bend = opts.bend ?? 0, nx = -(y2 - y1), ny = x2 - x1, len = Math.hypot(nx, ny) || 1;
    const mx = (x1 + x2) / 2 + (nx / len) * bend, my = (y1 + y2) / 2 + (ny / len) * bend;
    const d = `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    const tone = opts.color || "ink", arrow = opts.color || "ink";
    const label = opts.label ? `<text x="${mx + (opts.dx || 0)}" y="${my - 12 + (opts.dy || 0)}" text-anchor="middle" class="t-edge-label">${esc(opts.label)}</text>` : "";
    const moving = opts.still ? "" : `<circle r="7" class="t-packet ${tone}"><animateMotion dur="${(2.6 + (index % 4) * .35).toFixed(2)}s"
      begin="-${(index * .3).toFixed(1)}s" repeatCount="indefinite" path="${d}"/></circle>`;
    return `<path d="${d}" class="t-edge ${opts.dash ? "dash" : ""} ${tone}" marker-end="url(#t-arrow-${arrow})"/>${label}${moving}`;
  }

  function group(g) {
    const width = g.label.length * 12 + 34;
    return `<g filter="url(#t-wobble)"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="26" class="t-group ${g.color || ""}"/></g>
      <rect x="${g.x + 26}" y="${g.y - 19}" width="${width}" height="38" rx="12" class="t-pill"/>
      <text x="${g.x + 26 + width / 2}" y="${g.y + 7}" text-anchor="middle" class="t-group-label">${esc(g.label)}</text>`;
  }

  // Twelve (or ten) equal boxes for the slides that explain words.
  function grid(items, cols, opts = {}) {
    const gap = 16, rows = Math.ceil(items.length / cols), top = opts.top || 8;
    const w = (W - gap * (cols - 1)) / cols, h = (H - top - gap * (rows - 1) - 8) / rows;
    return items.map(([icon, label, sub, color], i) => ({ icon, label, sub, color, iconSize: opts.iconSize || 84,
      x: (i % cols) * (w + gap), y: top + Math.floor(i / cols) * (h + gap), w, h }));
  }

  function draw({ groups = [], nodes = [], edges = [], notes = [] }) {
    const byId = Object.fromEntries(nodes.map((n, i) => [n.id ?? i, n]));
    return `<svg class="tech-svg" viewBox="0 0 ${W} ${H}" role="img">
      ${groups.map(group).join("")}
      ${edges.map((e, i) => edge(e, byId, i)).join("")}
      ${nodes.map(box).join("")}
      ${notes.map((n) => textLines(wrap(n.text, n.chars || 60), n.x, n.y, n.cls || "t-note", 30, n.anchor || "middle")).join("")}
    </svg>`;
  }

  // Each slide: <div class="body tech" id="name"> filled the first time the slide opens.
  const slide = (name, spec) => { Demos[name] = { init(root) { root.innerHTML = draw(spec); } }; };
  return { slide, grid };
})();
