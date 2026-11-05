// Slides 28-33: how each part works, one big flow per slide.
const n = (id, label, x, y, w, h, icon, color, sub, extra = {}) => ({ id, label, x, y, w, h, icon, color, sub, ...extra });

TECH.slide("t-ollama", {
  nodes: [
    n("app", "App", 0, 225, 170, 190, "i-gear", "paper", "asks for a role"),
    n("gate", "Bifrost", 225, 225, 170, 190, "bifrost.png", "navy"),
    n("ollama", "Ollama", 460, 165, 240, 310, "ollama.svg", "green", "on Windows, port 11434", { iconSize: 130 }),
    n("a", "Analyst", 775, 8, 310, 190, "qwen.svg", "amber", "qwen2.5 7B", { row: true }),
    n("j", "Judge", 775, 225, 310, 190, "llama.svg", "amber", "llama3.1 8B", { row: true }),
    n("e", "Embed", 775, 442, 310, 190, "i-hash", "amber", "nomic-embed-text", { row: true }),
    n("gpu", "GPU", 1160, 205, 188, 230, "i-gpu", "red", "GTX 1660, 6 GB"),
  ],
  edges: [["app", "gate"], ["gate", "ollama"], ["ollama", "a", { bend: -14 }], ["ollama", "j"], ["ollama", "e", { bend: 14 }],
    ["a", "gpu", { bend: -14, still: true }], ["j", "gpu", { still: true }], ["e", "gpu", { bend: 14, still: true }]],
});

TECH.slide("t-bifrost", {
  nodes: [
    n("app", "App", 0, 195, 190, 210, "i-gear", "paper", "every model call"),
    n("b", "Bifrost", 280, 150, 250, 300, "bifrost.png", "navy", "port 8080", { iconSize: 130 }),
    n("q", "On the list?", 625, 175, 230, 250, null, "amber", null, { diamond: true, chars: 7 }),
    n("yes", "Ollama", 985, 15, 300, 180, "ollama.svg", "green", "3 allowed models", { row: true }),
    n("no", "Refused", 985, 405, 300, 180, "i-x", "red", "HTTP 400, never runs", { row: true }),
    n("log", "Logs", 240, 510, 170, 125, "i-doc", "paper", null, { row: true }),
    n("lf", "Langfuse", 480, 510, 240, 125, "langfuse.svg", "pink", null, { row: true }),
  ],
  edges: [["app", "b"], ["b", "q"], ["q", "yes", { label: "yes", color: "green", dy: -6 }], ["q", "no", { label: "no", color: "red", dy: 40 }],
    ["b", "log", { dash: true, color: "amber" }], ["b", "lf", { dash: true, color: "amber" }]],
});

TECH.slide("t-langfuse", {
  groups: [{ x: 0, y: 24, w: 1348, h: 288, label: "Prompts", color: "navy" }, { x: 0, y: 350, w: 1348, h: 288, label: "Traces", color: "red" }],
  nodes: [
    n("edit", "Edit", 40, 72, 190, 205, "i-pen", "paper", "no code change"),
    n("ver", "Versions", 300, 72, 200, 205, "i-layers", "pink", "v1 · v2 · v3"),
    n("lab", "production", 570, 72, 200, 205, "i-tag", "amber", "the live one", { chars: 11 }),
    n("app1", "App reads", 840, 72, 190, 205, "i-gear", "paper", "within 60s"),
    n("m", "Model", 1100, 72, 190, 205, "i-chip", "green", "prompt@v3", { subChars: 10 }),
    n("src", "App + Bifrost", 40, 396, 190, 205, "bifrost.png", "paper", "send each step", { chars: 8 }),
    n("lf", "Langfuse", 300, 396, 200, 205, "langfuse.svg", "pink", "self-hosted"),
    n("store", "Stored", 570, 396, 200, 205, "i-db", "navy", "ClickHouse, Postgres, Redis, MinIO", { iconSize: 58, subChars: 19 }),
    n("tag", "Tags", 840, 396, 190, 205, "i-tag", "red", "guardrail: red_flag", { subChars: 12 }),
    n("you", "You see it", 1100, 396, 190, 205, "i-user", "green", "every step"),
  ],
  edges: [["edit", "ver"], ["ver", "lab"], ["lab", "app1"], ["app1", "m"],
    ["src", "lf", { color: "amber" }], ["lf", "store", { color: "amber" }], ["store", "tag", { color: "amber" }], ["tag", "you", { color: "amber" }]],
});

TECH.slide("t-ragas", {
  nodes: [
    n("key", "Answer key", 0, 20, 260, 260, "i-clipboard", "paper", "right answers", { iconSize: 110 }),
    n("doc", "Clauses", 370, 20, 260, 260, "i-doc", "navy", "what it read", { iconSize: 110 }),
    n("a", "Analyst", 740, 20, 260, 260, "qwen.svg", "amber", "writes the answer", { iconSize: 110 }),
    n("ans", "Answer", 1095, 20, 253, 260, "i-chat", "paper", "with a page cited", { iconSize: 110 }),
    n("j", "Judge", 1095, 365, 253, 265, "llama.svg", "red", "a different family", { iconSize: 110 }),
    n("r", "Ragas", 740, 365, 260, 265, "ragas.png", "green", "faithful? relevant?", { iconSize: 120 }),
    n("sc", "Scores", 370, 365, 260, 265, "i-chart", "pink", "saved on the trace", { iconSize: 110 }),
    n("lf", "Langfuse", 0, 365, 260, 265, "langfuse.svg", "pink", "see them all", { iconSize: 110 }),
  ],
  edges: [["key", "doc"], ["doc", "a"], ["a", "ans"], ["ans", "j"], ["j", "r"], ["r", "sc"], ["sc", "lf"]],
});

TECH.slide("t-rag", {
  groups: [{ x: 0, y: 24, w: 1348, h: 268, label: "Upload", color: "navy" }, { x: 0, y: 340, w: 1348, h: 298, label: "Ask", color: "red" }],
  nodes: [
    n("pdf", "PDF", 40, 70, 190, 195, "i-doc", "paper"),
    n("cl", "Clauses", 340, 70, 190, 195, "i-stack", "navy", "page + heading"),
    n("em", "Embed", 640, 70, 190, 195, "i-hash", "amber", "text to numbers"),
    n("ch", "Chroma", 1000, 70, 260, 195, "chroma.png", "navy", "stored on disk"),
    n("q", "Question", 30, 388, 180, 215, "i-chat", "paper", "breach?"),
    n("sy", "Contract words", 275, 388, 200, 215, "i-link", "amber", "security incident", { chars: 8 }),
    n("se", "Search", 540, 388, 180, 215, "i-search", "navy", "meaning + keywords", { subChars: 12 }),
    n("a", "Analyst", 785, 388, 180, 215, "qwen.svg", "green", "reads top 5"),
    n("ans", "Cited answer", 1040, 388, 270, 215, "i-check", "green", "page, or Not found", { chars: 12 }),
  ],
  edges: [["pdf", "cl"], ["cl", "em"], ["em", "ch"], ["q", "sy"], ["sy", "se"], ["se", "a"], ["a", "ans"],
    ["ch", "se", { color: "green", bend: 30, dash: true }]],
});

TECH.slide("t-agent", {
  groups: [{ x: 520, y: 24, w: 828, h: 268, label: "Python checks: stricter only", color: "red" }],
  nodes: [
    n("std", "10 standards", 0, 70, 190, 195, "i-clipboard", "paper", "one by one", { chars: 9 }),
    n("m", "Model reads", 265, 70, 190, 195, "i-chip", "amber", "strict JSON", { chars: 8 }),
    n("r", "Red flag", 555, 70, 175, 195, "i-flag", "red", "walk-away words", { subChars: 10 }),
    n("q", "Quote", 755, 70, 175, 195, "i-marker", "red", "really in the PDF?", { subChars: 10 }),
    n("no", "Numbers", 955, 70, 175, 195, "i-hash", "red", "days, hours, %", { subChars: 10 }),
    n("sc", "Score", 1150, 70, 175, 195, "i-gauge", "navy", "plain maths"),
    n("gate", "Risky?", 960, 345, 240, 270, null, "amber", null, { diamond: true }),
    n("law", "Lawyer", 610, 370, 215, 230, "i-pen", "green", "state saved, waits", { iconSize: 100 }),
    n("iss", "Issues List", 240, 370, 215, 230, "i-send", "green", "ready to send", { iconSize: 100, chars: 8 }),
    n("sql", "SQLite", 1225, 420, 123, 130, "sqlite.svg", "paper", null),
  ],
  edges: [["std", "m"], ["m", "r"], ["r", "q"], ["q", "no"], ["no", "sc"], ["sc", "gate", { bend: 16 }],
    ["gate", "law", { label: "yes", color: "red" }], ["law", "iss"], ["gate", "sql", { dash: true, still: true }],
    ["gate", "iss", { bend: -112, color: "green" }]],
  notes: [{ x: 880, y: 556, text: "no", cls: "t-edge-label" }],
});
