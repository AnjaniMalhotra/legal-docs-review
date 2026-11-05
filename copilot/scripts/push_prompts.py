"""Loads prompts/*.md into Langfuse as the production version. A prompt that has not changed is skipped.

Run it once on a new machine, and after editing a prompt file:  make prompts
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from langfuse import get_client  # noqa: E402

from app.core.config import PROMPTS_DIR, settings  # noqa: E402

LABEL = settings()["prompts"]["label"]


def current_text(client, name: str) -> str | None:
    """The production text in Langfuse, or None if this prompt is new."""
    try:
        return client.get_prompt(name, label=LABEL, cache_ttl_seconds=0).prompt
    except Exception:
        return None


def main() -> None:
    client = get_client()
    for path in sorted(PROMPTS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        if current_text(client, path.stem) == text:
            print(f"= {path.stem}: no change")
            continue
        prompt = client.create_prompt(name=path.stem, prompt=text, labels=[LABEL], commit_message=f"From prompts/{path.name}")
        print(f"+ {path.stem}: version {prompt.version}")
    client.flush()


if __name__ == "__main__":
    main()
