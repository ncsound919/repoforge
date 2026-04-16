"""RepoForge LangGraph state machine definition."""
from __future__ import annotations
from typing import Literal
from langgraph.graph import StateGraph, END
from worker.state import RepoForgeState, SandboxResult, Approval
from worker.agents.apprentice import apprentice_node
from worker.agents.planner import planner_node
from worker.agents.executor import executor_node

# Routing function: decides what happens after sandbox validation
def route_after_sandbox(
    state: RepoForgeState,
) -> Literal["needs_approval", "auto_apply", "failed"]:
    if state.sandbox_result is None or state.sandbox_result.exit_code != 0:
        return "failed"

    sr = state.sandbox_result
    approval = state.approval

    # Any score outside policy thresholds forces human review
    needs_human = (
        (approval and approval.risk_score > 0.3) or
        (approval and approval.breaking_change_score > 0.15) or
        (approval and approval.confidence_score < 0.85) or
        sr.test_pass_rate < 0.98
    )

    if needs_human:
        return "needs_approval"

    return "auto_apply"

# Placeholder nodes for Phase 2+ agents
def sandbox_node(state: RepoForgeState) -> dict:
    """TODO (Phase 2): Implement E2B/Firecracker sandbox execution."""
    return {"state": "validating"}

def approval_gate_node(state: RepoForgeState) -> dict:
    """TODO (Phase 2): Implement LangGraph HITL interrupt for human approval."""
    return {"state": "awaiting_approval"}

def git_operator_node(state: RepoForgeState) -> dict:
    """TODO (Phase 2): Implement branch creation and PR submission."""
    return {"state": "applied"}

# Build the graph
def build_repoforge_graph() -> StateGraph:
    graph = StateGraph(RepoForgeState)

    graph.add_node("apprentice", apprentice_node)
    graph.add_node("planner", planner_node)
    graph.add_node("executor", executor_node)
    graph.add_node("sandbox", sandbox_node)
    graph.add_node("approval_gate", approval_gate_node)
    graph.add_node("git_operator", git_operator_node)

    graph.set_entry_point("apprentice")
    graph.add_edge("apprentice", "planner")
    graph.add_edge("planner", "executor")
    graph.add_edge("executor", "sandbox")
    graph.add_conditional_edges(
        "sandbox",
        route_after_sandbox,
        {
            "needs_approval": "approval_gate",
            "auto_apply": "git_operator",
            "failed": END,
        },
    )
    graph.add_edge("approval_gate", "git_operator")
    graph.add_edge("git_operator", END)

    return graph

app = build_repoforge_graph().compile()
