"""Runs router — create and manage LangGraph orchestration runs."""
from __future__ import annotations

import time

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from worker.store import store

router = APIRouter()

_TERMINAL_STATES = {"applied", "failed", "rolled_back"}


class RunCreate(BaseModel):
    repo_id: str
    goal: str
    trigger: str = "manual"


@router.get("/")
def list_runs(repo_id: str | None = None) -> list[dict]:
    return store.list_runs(repo_id=repo_id)


@router.post("/", status_code=201)
def create_run(body: RunCreate, background_tasks: BackgroundTasks) -> dict:
    if store.get_repo(body.repo_id) is None:
        raise HTTPException(status_code=404, detail="Repo not found")

    run = store.create_run(
        repo_id=body.repo_id,
        goal=body.goal,
        trigger=body.trigger,
    )
    background_tasks.add_task(_advance_run, run["run_id"])
    return run


@router.get("/{run_id}")
def get_run(run_id: str) -> dict:
    run = store.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.patch("/{run_id}/cancel")
def cancel_run(run_id: str) -> dict:
    run = store.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if run["state"] in _TERMINAL_STATES:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel a run in terminal state: {run['state']}",
        )
    updated = store.update_run_state(run_id, "failed")
    store.append_audit_event(
        run_id=run_id,
        node_name="cancel",
        from_state=run["state"],
        to_state="failed",
        actor_type="human",
    )
    return updated


# ---------------------------------------------------------------------------
# Background task — simulates the graph advancing through states
# ---------------------------------------------------------------------------

def _advance_run(run_id: str) -> None:
    """Placeholder: advances the run through its initial states.

    Phase 2 will replace this with the real LangGraph invocation.
    """
    transitions = [
        ("queued", "planning"),
        ("planning", "sandboxing"),
        ("sandboxing", "validating"),
    ]
    for from_state, to_state in transitions:
        time.sleep(0.5)
        run = store.get_run(run_id)
        if run is None or run["state"] in _TERMINAL_STATES:
            break
        store.update_run_state(run_id, to_state)
        store.append_audit_event(
            run_id=run_id,
            node_name="graph",
            from_state=from_state,
            to_state=to_state,
            actor_type="agent",
        )
