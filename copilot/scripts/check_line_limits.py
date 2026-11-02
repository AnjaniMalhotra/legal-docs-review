"""Enforces the project rule: no source file over MAX_LINES lines.

Usage:  python scripts/check_line_limits.py [path ...]   (default: whole copilot/)
Exit code 1 if any file is too long. Also used by the Claude Code hook.
"""
import sys
from pathlib import Path

MAX_LINES = 120
EXTENSIONS = {".py", ".js", ".css", ".html", ".yaml", ".yml", ".json", ".md", ".sh", ".toml"}
SKIP_DIRS = {".venv", "data", "models", "__pycache__", ".pytest_cache", "node_modules"}
ROOT = Path(__file__).resolve().parents[1]


def files(paths: list[str]):
    for p in map(Path, paths or [str(ROOT)]):
        if p.is_file():
            yield p
        elif p.is_dir():
            for f in p.rglob("*"):
                if f.is_file() and f.suffix in EXTENSIONS and not SKIP_DIRS & set(f.parts):
                    yield f


def main(paths: list[str]) -> int:
    too_long = []
    for f in files(paths):
        if f.suffix not in EXTENSIONS:
            continue
        count = sum(1 for _ in f.open(encoding="utf-8", errors="ignore"))
        if count > MAX_LINES:
            too_long.append((count, f))
    for count, f in sorted(too_long, reverse=True):
        print(f"✗ {count} lines (max {MAX_LINES}): {f}")
    if not too_long:
        print(f"✓ all files within {MAX_LINES} lines")
    return 1 if too_long else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
