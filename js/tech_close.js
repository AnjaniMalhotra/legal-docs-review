// Slides 38-40: what the app still gets wrong, the class exercise, and the close.
const LIMITS = [
  ["A required clause is missing", "No clean Missing", "i-mute", "amber", "Lawyer checks"],
  ["Reads the wrong sub-clause", "Marked OK once", "i-doc", "red", "Lawyer signs off"],
  ["Prompt leak, reworded", "Python can miss it", "i-eye", "amber", "Prompt rules"],
  ["Not every rule is right", "76% exact", "i-gauge", "amber", "Lawyer signs off"],
];
const limitNodes = [], limitEdges = [];
LIMITS.forEach(([limit, result, icon, color, net], i) => {
  const y = 8 + i * 158;
  limitNodes.push(n(`l${i}`, limit, 0, y, 560, 140, icon, "paper", null, { row: true, chars: 30 }),
    n(`r${i}`, result, 640, y, 350, 140, color === "red" ? "i-x" : "i-flag", color, null, { row: true, chars: 14 }),
    n(`s${i}`, net, 1070, y, 278, 140, net === "Prompt rules" ? "i-shield" : "i-pen", "green", null, { row: true, chars: 9 }));
  limitEdges.push([`l${i}`, `r${i}`, { color: color === "red" ? "red" : "amber" }], [`r${i}`, `s${i}`, { color: "green" }]);
});
TECH.slide("t-limits", { nodes: limitNodes, edges: limitEdges });

TECH.slide("t-exercise", {
  nodes: [
    n("rules", "Standards sheet", 0, 110, 232, 360, "i-clipboard", "navy", "the 10 rules", { iconSize: 110, chars: 9 }),
    n("sun", "Sunrise", 279, 110, 232, 360, "i-doc", "paper", "2 pages, simple words", { iconSize: 110, subChars: 12 }),
    n("hand", "Mark it by hand", 558, 110, 232, 360, "i-pen", "amber", "clause against rule", { iconSize: 110, chars: 9, subChars: 12 }),
    n("solved", "Solved copy", 837, 110, 232, 360, "i-check", "green", "compare, then score", { iconSize: 110, chars: 7, subChars: 12 }),
    n("north", "Northstar", 1116, 110, 232, 360, "i-flag", "red", "11 pages, one trap", { iconSize: 110, subChars: 12 }),
  ],
  edges: [["rules", "sun"], ["sun", "hand"], ["hand", "solved"], ["solved", "north"]],
  notes: [{ x: 674, y: 565, text: "All five PDFs: example_legal_contracts" }],
});

TECH.slide("t-close", {
  nodes: [
    n("m", "The model reads", 0, 90, 400, 370, "i-chip", "amber", null, { iconSize: 150, chars: 18 }),
    n("p", "Python decides", 474, 90, 400, 370, "i-gauge", "navy", null, { iconSize: 150, chars: 18 }),
    n("l", "A lawyer signs", 948, 90, 400, 370, "i-pen", "green", null, { iconSize: 150, chars: 18 }),
  ],
  edges: [["m", "p"], ["p", "l"]],
  notes: [{ x: 674, y: 560, text: "Built so nothing leaves the machine." }],
});
