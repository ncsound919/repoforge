"""Full API test suite for the RepoForge FastAPI worker."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class TestHealth:
    def test_returns_ok(self, client: TestClient):
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ok"
        assert "version" in body

    def test_version_format(self, client: TestClient):
        body = client.get("/health").json()
        parts = body["version"].split(".")
        assert len(parts) == 3


# ---------------------------------------------------------------------------
# Repos
# ---------------------------------------------------------------------------

class TestRepos:
    def test_list_empty(self, client: TestClient):
        assert client.get("/repos/").json() == []

    def test_create(self, client: TestClient):
        resp = client.post(
            "/repos/", json={"name": "my-repo", "path": "/home/user/my-repo"}
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "my-repo"
        assert body["path"] == "/home/user/my-repo"
        assert "repo_id" in body
        assert "created_at" in body

    def test_list_after_create(self, client: TestClient):
        client.post("/repos/", json={"name": "r1", "path": "/r1"})
        client.post("/repos/", json={"name": "r2", "path": "/r2"})
        repos = client.get("/repos/").json()
        assert len(repos) == 2

    def test_get_by_id(self, client: TestClient, sample_repo: dict):
        rid = sample_repo["repo_id"]
        resp = client.get(f"/repos/{rid}")
        assert resp.status_code == 200
        assert resp.json()["repo_id"] == rid

    def test_get_not_found(self, client: TestClient):
        assert client.get("/repos/nonexistent").status_code == 404

    def test_create_with_languages(self, client: TestClient):
        resp = client.post(
            "/repos/",
            json={"name": "polyglot", "path": "/poly", "language": ["python", "rust"]},
        )
        assert resp.json()["language"] == ["python", "rust"]


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------

class TestRuns:
    def test_list_empty(self, client: TestClient):
        assert client.get("/runs/").json() == []

    def test_create(self, client: TestClient, sample_repo: dict):
        resp = client.post(
            "/runs/",
            json={"repo_id": sample_repo["repo_id"], "goal": "Add test coverage"},
        )
        assert resp.status_code == 201
        body = resp.json()
        assert body["goal"] == "Add test coverage"
        assert body["state"] == "queued"
        assert body["trigger"] == "manual"
        assert "run_id" in body

    def test_create_unknown_repo(self, client: TestClient):
        resp = client.post(
            "/runs/", json={"repo_id": "ghost", "goal": "anything"}
        )
        assert resp.status_code == 404

    def test_get_by_id(self, client: TestClient, sample_repo: dict):
        run_id = client.post(
            "/runs/",
            json={"repo_id": sample_repo["repo_id"], "goal": "Refactor"},
        ).json()["run_id"]
        resp = client.get(f"/runs/{run_id}")
        assert resp.status_code == 200
        assert resp.json()["run_id"] == run_id

    def test_get_not_found(self, client: TestClient):
        assert client.get("/runs/ghost").status_code == 404

    def test_filter_by_repo_id(self, client: TestClient, sample_repo: dict):
        repo2 = client.post(
            "/repos/", json={"name": "other", "path": "/other"}
        ).json()
        client.post(
            "/runs/", json={"repo_id": sample_repo["repo_id"], "goal": "g1"}
        )
        client.post("/runs/", json={"repo_id": repo2["repo_id"], "goal": "g2"})

        runs = client.get(f"/runs/?repo_id={sample_repo['repo_id']}").json()
        assert len(runs) == 1
        assert runs[0]["repo_id"] == sample_repo["repo_id"]

    def test_cancel(self, client: TestClient, sample_repo: dict):
        run_id = client.post(
            "/runs/", json={"repo_id": sample_repo["repo_id"], "goal": "test"}
        ).json()["run_id"]
        resp = client.patch(f"/runs/{run_id}/cancel")
        assert resp.status_code == 200
        assert resp.json()["state"] == "failed"

    def test_cancel_terminal_run(self, client: TestClient, sample_repo: dict):
        run_id = client.post(
            "/runs/", json={"repo_id": sample_repo["repo_id"], "goal": "test"}
        ).json()["run_id"]
        client.patch(f"/runs/{run_id}/cancel")
        # Cancelling again should 400
        assert client.patch(f"/runs/{run_id}/cancel").status_code == 400

    def test_cancel_not_found(self, client: TestClient):
        assert client.patch("/runs/ghost/cancel").status_code == 404

    def test_custom_trigger(self, client: TestClient, sample_repo: dict):
        resp = client.post(
            "/runs/",
            json={
                "repo_id": sample_repo["repo_id"],
                "goal": "scheduled task",
                "trigger": "scheduled",
            },
        )
        assert resp.json()["trigger"] == "scheduled"


# ---------------------------------------------------------------------------
# Approvals
# ---------------------------------------------------------------------------

class TestApprovals:
    def _seed_approval(self, client: TestClient, sample_repo: dict) -> dict:
        run_id = client.post(
            "/runs/",
            json={"repo_id": sample_repo["repo_id"], "goal": "risky refactor"},
        ).json()["run_id"]
        # Directly create via store for determinism in unit tests
        from worker.store import store
        return store.create_approval(run_id=run_id, risk_score=0.5, diff_ref="diff/1")

    def test_list_empty(self, client: TestClient):
        assert client.get("/approvals/").json() == []

    def test_get_by_id(self, client: TestClient, sample_repo: dict):
        approval = self._seed_approval(client, sample_repo)
        resp = client.get(f"/approvals/{approval['approval_id']}")
        assert resp.status_code == 200
        assert resp.json()["approval_id"] == approval["approval_id"]

    def test_get_not_found(self, client: TestClient):
        assert client.get("/approvals/ghost").status_code == 404

    def test_approve(self, client: TestClient, sample_repo: dict):
        approval = self._seed_approval(client, sample_repo)
        resp = client.patch(
            f"/approvals/{approval['approval_id']}",
            json={"decision": "approved", "decided_by": "human"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["decision"] == "approved"
        assert body["decided_at"] is not None

    def test_reject(self, client: TestClient, sample_repo: dict):
        approval = self._seed_approval(client, sample_repo)
        resp = client.patch(
            f"/approvals/{approval['approval_id']}",
            json={"decision": "rejected"},
        )
        assert resp.json()["decision"] == "rejected"

    def test_invalid_decision(self, client: TestClient, sample_repo: dict):
        approval = self._seed_approval(client, sample_repo)
        resp = client.patch(
            f"/approvals/{approval['approval_id']}",
            json={"decision": "maybe"},
        )
        assert resp.status_code == 400

    def test_filter_by_run_id(self, client: TestClient, sample_repo: dict):
        a1 = self._seed_approval(client, sample_repo)
        a2 = self._seed_approval(client, sample_repo)
        run_id = a1["run_id"]
        # Both may share the same run_id; just confirm filtering works
        approvals = client.get(f"/approvals/?run_id={run_id}").json()
        assert all(a["run_id"] == run_id for a in approvals)
