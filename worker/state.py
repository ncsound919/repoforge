"""RepoForge LangGraph typed state definitions."""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field
import uuid

RunState = Literal[
    "queued", "planning", "sandboxing", "validating",
    "awaiting_approval", "approved", "rejected",
    "applied", "rolled_back", "failed"
]

SkillType = Literal[
    "api_usage", "error_handling", "test_pattern", "architectural_invariant"
]

class SkillsEntry(BaseModel):
    skill_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repo_id: str
    skill_type: SkillType
    pattern_description: str
    source_commits: list[str]
    confidence: float  # 0.0–1.0
    last_seen_at: str
    created_at: str

class StructuredAction(BaseModel):
    action_type: Literal["edit_function", "add_method", "add_class", "delete_node", "add_import"]
    file_path: str
    node_id: str        # tree-sitter node identifier
    node_type: str      # e.g. "function_definition", "class_definition"
    description: str    # Human-readable description of what this action does
    new_content: str    # The new code content for this node

class SandboxResult(BaseModel):
    sandbox_id: str
    executor_type: Literal["local_docker", "e2b_firecracker"]
    test_pass_rate: float
    exit_code: int
    artifacts: list[str]  # Paths to captured artifacts
    diff_ref: str         # Reference to the generated diff
    resource_usage: dict
    duration_seconds: float

class Approval(BaseModel):
    approval_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    run_id: str
    risk_score: float
    breaking_change_score: float
    confidence_score: float
    test_pass_rate: float
    diff_ref: str
    decision: Literal["pending", "approved", "rejected", "expired"] = "pending"
    decided_by: Literal["human", "auto_policy"] = "human"
    decided_at: Optional[str] = None
    expires_at: str

class BudgetDecision(BaseModel):
    model_selected: str
    reason: str
    estimated_cost: float
    budget_remaining: float
    escalated: bool = False

class AuditEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    run_id: str
    node_name: str
    from_state: RunState
    to_state: RunState
    actor_type: Literal["agent", "human", "policy", "system"]
    artifact_refs: list[str] = []
    budget_decision: Optional[BudgetDecision] = None
    timestamp: str

class RepoForgeState(BaseModel):
    """LangGraph typed state for a single RepoForge run."""
    run_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    repo_id: str
    repo_path: str
    goal: str
    trigger: Literal["manual", "scheduled", "watcher", "self_improving"] = "manual"
    state: RunState = "queued"
    skills: list[SkillsEntry] = []
    plan: list[StructuredAction] = []
    sandbox_result: Optional[SandboxResult] = None
    approval: Optional[Approval] = None
    budget_remaining: float = 1.0  # USD
    audit_trail: list[AuditEvent] = []
    provenance_ids: list[str] = []
    error: Optional[str] = None
