"""Policy review endpoints: read the standards, start a review, read it, record counsel decisions."""
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.config import standards
from app.graph import policy_service

router = APIRouter(prefix="/api/policy", tags=["policy"])

STANDARD_FIELDS = ("id", "title", "category", "weight", "critical", "rationale",
                   "preferred", "fallback", "walk_away", "approval", "standard_clause")


class Matter(BaseModel):
    counterparty: str = Field("", max_length=120)
    agreement_type: str = Field("", max_length=80)
    reference: str = Field("", max_length=40)


class StartRequest(BaseModel):
    doc_id: str
    reviewer: str = Field(min_length=2, max_length=80)
    matter: Matter = Matter()


class Decision(BaseModel):
    rule_id: str
    action: str                     # approve | override | note
    new_status: str | None = None   # required for override
    note: str | None = None         # required for override


class DecisionsRequest(BaseModel):
    decisions: list[Decision]


@router.get("/standards")
def get_standards() -> list[dict]:
    """Contracting Standards positions and approval authorities, shown alongside each finding."""
    return [{k: r[k] for k in STANDARD_FIELDS} for r in standards()]


@router.post("/reviews")
def start_review(req: StartRequest) -> dict:
    """Run the review; it pauses here if a lawyer must decide."""
    return policy_service.start(req.doc_id, req.reviewer.strip(), req.matter.model_dump())


@router.post("/reviews/{review_id}/decisions")
def submit_decisions(review_id: str, req: DecisionsRequest) -> dict:
    """Record the lawyer's decisions and finish the review."""
    return policy_service.resume(review_id, [d.model_dump() for d in req.decisions])
