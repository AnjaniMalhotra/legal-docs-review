"""Local Chroma vector store, one collection per uploaded contract.

Runs in-process with telemetry disabled; data stays in data/chroma.
"""
from functools import lru_cache

import chromadb
from chromadb.config import Settings

from app.core import gateway
from app.core.config import data_dir, settings


@lru_cache
def _client() -> chromadb.ClientAPI:
    return chromadb.PersistentClient(
        path=str(data_dir("chroma")),
        settings=Settings(anonymized_telemetry=False, allow_reset=False),
    )


def _collection(doc_id: str):
    return _client().get_or_create_collection(name=doc_id, metadata={"hnsw:space": "cosine"})


def _prefix(kind: str) -> str:
    return settings()["models"]["embed"].get(f"{kind}_prefix", "")


def add_chunks(doc_id: str, chunks: list[dict]) -> None:
    # Embed the clause with its section heading so short sub-clauses keep their context.
    vectors = gateway.embed([f"{_prefix('document')}{c['heading']}: {c['text']}" for c in chunks])
    _collection(doc_id).add(
        ids=[c["chunk_id"] for c in chunks],
        embeddings=vectors,
        documents=[c["text"] for c in chunks],
        metadatas=[{"page": c["page"], "clause_no": c["clause_no"], "heading": c["heading"]} for c in chunks],
    )


def search(doc_id: str, query: str, top_k: int) -> list[dict]:
    """Return the top_k most similar chunks with page and heading."""
    collection = _collection(doc_id)
    count = collection.count()
    if count == 0:
        return []
    vector = gateway.embed([f"{_prefix('query')}{query}"])[0]
    res = collection.query(query_embeddings=[vector], n_results=min(top_k, count))
    hits = []
    for text, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
        hits.append({"text": text, "page": meta["page"], "heading": meta["heading"], "distance": dist})
    return hits


def opening(doc_id: str, n: int) -> list[dict]:
    """The first n chunks of the agreement (cover page, parties and recitals), in document order."""
    res = _collection(doc_id).get(ids=[f"c{i:04d}" for i in range(1, n + 1)], include=["documents", "metadatas"])
    hits = [{"chunk_id": cid, "text": text, "page": meta["page"], "heading": meta["heading"], "distance": 0.0}
            for cid, text, meta in zip(res["ids"], res["documents"], res["metadatas"])]
    return sorted(hits, key=lambda h: h["chunk_id"])


def delete(doc_id: str) -> None:
    try:
        _client().delete_collection(doc_id)
    except Exception:  # already gone
        pass
