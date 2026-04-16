"""Apprentice Agent — learns from repo commit history to build the skills database."""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from worker.state import RepoForgeState, SkillsEntry, SkillType

logger = logging.getLogger(__name__)

# Skill type categories for pattern extraction
SKILL_CATEGORIES: list[SkillType] = [
    "api_usage",
    "error_handling",
    "test_pattern",
    "architectural_invariant",
]

def apprentice_node(state: RepoForgeState) -> dict:
    """
    LangGraph node: Apprentice Agent.

    Analyzes the target repository's commit history to extract
    reusable skill patterns. These patterns become the context
    that makes all subsequent agent actions feel native to the codebase.

    Steps:
    1. Load last N commits via GitPython
    2. Parse changed files using tree-sitter
    3. Extract patterns per skill category
    4. Generate embeddings and write to pgvector skills DB
    5. Return updated state with populated skills list
    """
    logger.info(f"[apprentice] Starting skills extraction for repo: {state.repo_id}")

    # TODO (Phase 1): Implement full commit history analysis
    # Placeholder returns empty skills with audit log
    skills: list[SkillsEntry] = []

    logger.info(f"[apprentice] Extracted {len(skills)} skills from commit history")
    return {"skills": skills, "state": "planning"}
