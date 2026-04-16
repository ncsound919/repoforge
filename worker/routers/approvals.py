"""Approvals router — manage human-in-the-loop approval decisions."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from worker.store import store

router = APIRouter()


class ApprovalDecision(BaseModel):
    decision: str  # "approved" | "rejected"
    decided_by: str = "human"


@router.get("/")
def list_approvals(run_id: str | None = None) -> list[dict]:
    return store.list_approvals(run_id=run_id)


@router.get("/{approval_id}")
def get_approval(approval_id: str) -> dict:
    approval = store.get_approval(approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval not found")
    return approval


@router.patch("/{approval_id}")
def decide_approval(approval_id: str, body: ApprovalDecision) -> dict:
    if body.decision not in ("approved", "rejected"):
        raise HTTPException(
            status_code=400, detail="Decision must be 'approved' or 'rejected'"
        )
    approval = store.get_approval(approval_id)
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval not found")
    updated = store.decide_approval(
        approval_id=approval_id,
        decision=body.decision,
        decided_by=body.decided_by,
    )
    return updated
