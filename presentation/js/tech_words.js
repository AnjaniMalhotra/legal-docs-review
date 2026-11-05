// Slides 24-27: the words, the rules in plain English, and the tech stack.
TECH.slide("t-words-contract", { nodes: TECH.grid([
  ["i-doc", "Client paper", "The client's own contract", "red"],
  ["i-building", "Provider", "PayNest, the one hired", "navy"],
  ["i-stack", "MSA", "The main contract", "paper"],
  ["i-lock", "DPA", "Rules for employee data", "paper"],
  ["i-scale", "Liability cap", "The most PayNest can owe", "red"],
  ["i-shield", "Indemnity", "We pay if they get sued", "red"],
  ["i-bolt", "Breach notice", "Report a data leak, fast", "red"],
  ["i-chart", "SLA", "Promised uptime", "amber"],
  ["i-coin", "Service credit", "Discount if we miss it", "amber"],
  ["i-search", "Audit right", "Client can inspect us", "green"],
  ["i-door", "Termination", "How each side can exit", "green"],
  ["i-gavel", "Governing law", "Whose courts decide", "green"],
], 4) });

TECH.slide("t-words-review", { nodes: TECH.grid([
  ["i-check", "Ideal", "What PayNest wants", "green"],
  ["i-hand", "Can accept", "OK after negotiating", "amber"],
  ["i-x", "Never accept", "Needs senior approval", "red"],
  ["i-mute", "If silent", "Contract says nothing", "paper"],
  ["i-key", "Key rule", "P1, P2 and P3", "red"],
  ["i-gauge", "Risk score", "0 to 100, from Python", "navy"],
  ["i-layers", "Band", "Low to Critical", "navy"],
  ["i-floor", "Floor", "Key rule fails: at least High", "navy"],
  ["i-marker", "Grounding", "Quote must be in the PDF", "green"],
  ["i-flag", "Red flag", "Walk-away words", "red"],
  ["i-pause", "Human gate", "A lawyer decides", "amber"],
  ["i-send", "Issues List", "Changes we ask for", "paper"],
], 4) });

TECH.slide("t-standards", {
  nodes: TECH.grid([
    ["i-scale", "P1 Liability", "Cap: 12 months' fees", "red"],
    ["i-shield", "P2 Indemnity", "Only for our own fault", "red"],
    ["i-bolt", "P3 Breach", "Tell within 24 hours", "red"],
    ["i-chart", "P4 Uptime", "99.5% each month", "amber"],
    ["i-search", "P5 Audit", "Once a year, 30 days' notice", "amber"],
    ["i-db", "P6 Deletion", "Return and delete in 30 days", "navy"],
    ["i-lock", "P7 Secrets", "Both sides keep them", "navy"],
    ["i-coin", "P8 Payment", "Pay within 30 days", "green"],
    ["i-door", "P9 Exit", "90 days' notice", "green"],
    ["i-gavel", "P10 Law", "India, Bengaluru courts", "green"],
  ], 5, { top: 48, iconSize: 92 }),
  notes: [{ x: 674, y: 30, text: "PayNest's own rules, not a law. Red = key rule." }],
});

const job = (id, label, x, y, icon, color) => ({ id, label, icon, color, x, y, w: 262, h: 128, row: true });
const tool = (id, label, sub, x, y, icon, color) => ({ id, label, sub, icon, color, x, y, w: 330, h: 128, row: true });
const STACK = [
  ["LLM", "Ollama", "Runs the models", "i-chip", "ollama.svg", "green"],
  ["Gateway", "Bifrost", "One door to models", "i-route", "bifrost.png", "navy"],
  ["Prompts + traces", "Langfuse", "Versions, every step", "i-eye", "langfuse.svg", "pink"],
  ["Evals", "Ragas", "Grades the answers", "i-gauge", "ragas.png", "amber"],
  ["Workflow", "LangGraph", "Pause for a lawyer", "i-flow", "langgraph.svg", "red"],
  ["Vectors", "Chroma", "Search by meaning", "i-hash", "chroma.png", "navy"],
  ["API", "FastAPI", "The app's backend", "i-gear", "fastapi.svg", "green"],
  ["Screen", "HTML · CSS · JS", "No framework", "i-browser", "html5.svg", "paper"],
];
const stackNodes = [], stackEdges = [];
STACK.forEach(([label, name, sub, jobIcon, toolIcon, color], i) => {
  const x = i < 4 ? 0 : 696, y = 22 + (i % 4) * 155;
  stackNodes.push(job(`j${i}`, label, x, y, jobIcon, "paper"), tool(`t${i}`, name, sub, x + 322, y, toolIcon, color));
  stackEdges.push([`j${i}`, `t${i}`]);
});
TECH.slide("t-stack", { nodes: stackNodes, edges: stackEdges });
