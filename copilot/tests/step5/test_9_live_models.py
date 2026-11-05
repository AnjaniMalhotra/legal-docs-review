"""Real models through the real gateway. Slow, so these only run with: make test-live"""
import os

import pytest
from openai import BadRequestError, OpenAI

from app.core import gateway
from app.core.config import ROOT, env
from app.ingest.ingest_service import ingest_pdf
from app.rag.answerer import answer

pytestmark = pytest.mark.skipif(os.getenv("RUN_LIVE_TESTS") != "1", reason="needs real models: make test-live")
CAREWELL = ROOT / "sample_contracts" / "01_carewell_hospitals.pdf"


def test_the_analyst_model_answers():
    assert gateway.chat("analyst", "Reply with exactly: OK")


def test_the_embedding_model_answers():
    assert len(gateway.embed(["liability cap"])[0]) > 100


def test_the_gateway_refuses_a_model_not_on_its_list():
    client = OpenAI(base_url=env("BIFROST_URL"), api_key="local")
    with pytest.raises(BadRequestError):
        client.chat.completions.create(model="ollama/llama3.2:1b", messages=[{"role": "user", "content": "hi"}])


def test_asking_about_a_breach_finds_the_right_clause():
    doc_id = ingest_pdf(CAREWELL.name, CAREWELL.read_bytes())["doc_id"]
    result = answer(doc_id, "How fast must we tell them about a breach?")
    assert "immediately" in result["answer"].lower()
