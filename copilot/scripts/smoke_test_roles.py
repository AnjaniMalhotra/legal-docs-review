"""Phase 1 exit check: one test prompt per role, through Bifrost.

Each call should appear in both the Bifrost logs and a Langfuse trace.
Usage:  make smoke
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core import gateway, tracing  # noqa: E402
from app.core.errors import GatewayError  # noqa: E402
from app.core.config import settings  # noqa: E402

PROMPT = "Reply with exactly: PayNest copilot online."


def main() -> int:
    failures = 0
    for role in settings()["models"]:
        start = time.perf_counter()
        try:
            if role == "embed":
                result = f"{len(gateway.embed(['PayNest'])[0])}-dim vector"
            else:
                result = gateway.chat(role, PROMPT)[:60]
            print(f"✓ {role:<8} {time.perf_counter() - start:5.1f}s  {result}")
        except GatewayError as exc:
            failures += 1
            print(f"✗ {role:<8} {exc}")
    tracing.flush()
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
