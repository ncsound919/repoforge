"""pytest fixtures shared across all worker tests."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from worker.main import app
from worker.store import store


@pytest.fixture(autouse=True)
def reset_store():
    """Reset the in-memory store before every test so tests are isolated."""
    store.reset()
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def sample_repo(client: TestClient) -> dict:
    resp = client.post("/repos/", json={"name": "test-repo", "path": "/tmp/test-repo"})
    assert resp.status_code == 201
    return resp.json()
