"""Repos router — register and list target repositories."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from worker.store import store

router = APIRouter()


class RepoCreate(BaseModel):
    name: str
    path: str
    language: list[str] = []


@router.get("/")
def list_repos() -> list[dict]:
    return store.list_repos()


@router.post("/", status_code=201)
def create_repo(body: RepoCreate) -> dict:
    return store.create_repo(name=body.name, path=body.path, language=body.language)


@router.get("/{repo_id}")
def get_repo(repo_id: str) -> dict:
    repo = store.get_repo(repo_id)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repo not found")
    return repo
