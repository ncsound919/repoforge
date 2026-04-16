"""Planner Agent — decomposes goals into structured AST-level actions."""
from __future__ import annotations
import logging
from worker.state import RepoForgeState, StructuredAction

logger = logging.getLogger(__name__)

def planner_node(state: RepoForgeState) -> dict:
    """
    LangGraph node: Planner Agent.

    Takes the high-level goal and the skills DB context from the
    Apprentice agent, then decomposes the goal into a series of
    StructuredAction objects targeting specific AST nodes.

    Key constraint: outputs MUST be StructuredAction objects
    (edit_function, add_method, etc.) — never raw text patches.
    This is what makes execution deterministic and auditable.
    """
    logger.info(f"[planner] Planning goal: '{state.goal}' with {len(state.skills)} skills in context")

    # TODO (Phase 1 / Phase 2): Implement LLM-powered planning with skills context injection
    plan: list[StructuredAction] = []

    logger.info(f"[planner] Generated {len(plan)} structured actions")
    return {"plan": plan, "state": "sandboxing"}
