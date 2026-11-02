"""Claude Code PostToolUse hook: warn when an edited copilot file exceeds 120 lines.

Reads the hook payload (JSON) from stdin. Exit code 2 sends the message back to
Claude so it splits the file; exit 0 means the file is fine or out of scope.
"""
import json
import sys
from pathlib import Path

MAX_LINES = 120
EXTENSIONS = {".py", ".js", ".css", ".html", ".yaml", ".yml", ".json", ".md", ".sh"}
SCOPE = "copilot"


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return 0
    path = Path(payload.get("tool_input", {}).get("file_path", ""))
    if SCOPE not in path.parts or path.suffix not in EXTENSIONS or not path.is_file():
        return 0
    lines = sum(1 for _ in path.open(encoding="utf-8", errors="ignore"))
    if lines > MAX_LINES:
        print(f"{path.name} has {lines} lines (limit {MAX_LINES}). Split it by responsibility "
              f"into smaller, well-named files.", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
