"""Stops the chat reply repeating its own instructions, which a prompt rule alone did not stop.

Python checks the model's reply after it is written, so no wording in a question can talk it out of this.
A long run of words copied from the prompt counts as a leak; a shorter match can be ordinary contract wording.
"""
import re

from app.core.config import settings


def _words(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


def refusal() -> str:
    return settings()["output_guard"]["refusal"]


def leaked(reply: str, template: str) -> bool:
    """True when the reply copies a long run of words from the prompt's fixed text."""
    said = _words(reply)
    if said == _words(refusal()):  # the prompt's own refusal sentence is the right reply, not a leak
        return False
    size = settings()["output_guard"]["leak_run_words"]
    padded = f" {' '.join(said)} "
    for part in re.split(r"\$\w+", template):  # the clauses and question are filled in later, so are not secret
        words = _words(part)
        if any(f" {' '.join(words[i:i + size])} " in padded for i in range(len(words) - size + 1)):
            return True
    return False
