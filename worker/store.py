"""In-memory data store — used for local dev and tests (no Postgres required)."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class _Store:
    """Simple dict-backed store that mimics the Postgres schema."""

    def __init__(self) -> None:
        self.repos: dict[str, dict] = {}
        self.runs: dict[str, dict] = {}
        self.approvals: dict[str, dict] = {}
        self.audit_events: list[dict] = []

    def reset(self) -> None:
        """Wipe all data. Used between test cases."""
        self.repos.clear()
        self.runs.clear()
        self.approvals.clear()
        self.audit_events.clear()

    # ------------------------------------------------------------------
    # Repos
    # ------------------------------------------------------------------

    def list_repos(self) -> list[dict]:
        return list(self.repos.values())

    def get_repo(self, repo_id: str) -> Optional[dict]:
        return self.repos.get(repo_id)

    def create_repo(self, name: str, path: str, language: list[str] | None = None) -> dict:
        # Enforce unique paths to match the Postgres schema constraint.
        for existing in self.repos.values():
            if existing["path"] == path:
                raise ValueError(f"A repository with path '{path}' already exists.")
        repo = {
            "repo_id": str(uuid.uuid4()),
            "name": name,
            "path": path,
            "language": language or [],
            "ingested_at": None,
            "created_at": _now(),
        }
        self.repos[repo["repo_id"]] = repo
        return repo

    # ------------------------------------------------------------------
    # Runs
    # ------------------------------------------------------------------

    def list_runs(self, repo_id: str | None = None) -> list[dict]:
        runs = list(self.runs.values())
        if repo_id:
            runs = [r for r in runs if r["repo_id"] == repo_id]
        return runs

    def get_run(self, run_id: str) -> Optional[dict]:
        # Return a shallow copy so callers cannot mutate internal store state
        # (guards audit logging from capturing the wrong `from_state`).
        run = self.runs.get(run_id)
        return dict(run) if run is not None else None

    def create_run(self, repo_id: str, goal: str, trigger: str = "manual") -> dict:
        run_id = str(uuid.uuid4())
        run = {
            "run_id": run_id,
            "repo_id": repo_id,
            "graph_id": f"graph_{run_id[:8]}",
            "state": "queued",
            "trigger": trigger,
            "goal": goal,
            "estimated_cost": 0.0,
            "actual_cost": 0.0,
            "executor_type": "local_docker",
            "started_at": _now(),
            "ended_at": None,
        }
        self.runs[run_id] = run
        return run

    def update_run_state(self, run_id: str, state: str) -> Optional[dict]:
        run = self.runs.get(run_id)
        if run is None:
            return None
        run["state"] = state
        if state in ("applied", "failed", "rolled_back"):
            run["ended_at"] = _now()
        return run

    # ------------------------------------------------------------------
    # Approvals
    # ------------------------------------------------------------------

    def list_approvals(self, run_id: str | None = None) -> list[dict]:
        approvals = list(self.approvals.values())
        if run_id:
            approvals = [a for a in approvals if a["run_id"] == run_id]
        return approvals

    def get_approval(self, approval_id: str) -> Optional[dict]:
        return self.approvals.get(approval_id)

    def create_approval(
        self,
        run_id: str,
        risk_score: float = 0.0,
        breaking_change_score: float = 0.0,
        confidence_score: float = 1.0,
        test_pass_rate: float = 1.0,
        diff_ref: str = "",
    ) -> dict:
        approval_id = str(uuid.uuid4())
        expires = datetime.now(timezone.utc) + timedelta(hours=24)
        approval = {
            "approval_id": approval_id,
            "run_id": run_id,
            "risk_score": risk_score,
            "breaking_change_score": breaking_change_score,
            "confidence_score": confidence_score,
            "test_pass_rate": test_pass_rate,
            "diff_ref": diff_ref,
            "decision": "pending",
            "decided_by": "human",
            "decided_at": None,
            "expires_at": expires.isoformat(),
        }
        self.approvals[approval_id] = approval
        return approval

    def decide_approval(
        self, approval_id: str, decision: str, decided_by: str = "human"
    ) -> Optional[dict]:
        approval = self.approvals.get(approval_id)
        if approval is None:
            return None
        approval["decision"] = decision
        approval["decided_by"] = decided_by
        approval["decided_at"] = _now()
        return approval

    # ------------------------------------------------------------------
    # Audit Events
    # ------------------------------------------------------------------

    def append_audit_event(
        self,
        run_id: str,
        node_name: str,
        from_state: str,
        to_state: str,
        actor_type: str = "system",
        artifact_refs: list[str] | None = None,
    ) -> dict:
        event = {
            "event_id": str(uuid.uuid4()),
            "run_id": run_id,
            "node_name": node_name,
            "from_state": from_state,
            "to_state": to_state,
            "actor_type": actor_type,
            "artifact_refs": artifact_refs or [],
            "timestamp": _now(),
        }
        self.audit_events.append(event)
        return event


# Module-level singleton — swapped out during tests via store.reset()
store = _Store()
