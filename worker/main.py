"""RepoForge FastAPI worker — main application entry point."""
from __future__ import annotations

from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from worker.routers import approvals, repos, runs

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(application: FastAPI):  # noqa: ARG001
    logger.info("repoforge_worker.start", version="0.4.0")
    yield
    logger.info("repoforge_worker.stop")


app = FastAPI(
    title="RepoForge Worker",
    description="LangGraph orchestration engine for autonomous repo evolution.",
    version="0.4.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:1420",
        "http://localhost:5173",
        "tauri://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict:
    """Liveness probe — returns 200 when the worker is ready."""
    return {"status": "ok", "version": "0.4.0"}


app.include_router(repos.router, prefix="/repos", tags=["repos"])
app.include_router(runs.router, prefix="/runs", tags=["runs"])
app.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
