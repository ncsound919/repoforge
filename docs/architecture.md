# RepoForge Architecture v0.4.0

## System Overview

RepoForge operates in three distinct phases: **Learn**, **Plan & Act**, and **Review & Merge**. Each phase is a first-class stage with its own state transitions, checkpoints, and audit events.

```
┌─────────────────────────────────────────────────────────┐
│                     LEARN PHASE                         │
│  Ingest → AST Parser → Apprentice Agent → Skills DB     │
└─────────────────────────────────────────────────────────┘
              ↓ skills_db_ready
┌─────────────────────────────────────────────────────────┐
│                  PLAN & ACT PHASE                       │
│  User Goal → Orchestrator → Planner → Action Executor   │
└─────────────────────────────────────────────────────────┘
              ↓ sandbox_output
┌─────────────────────────────────────────────────────────┐
│               REVIEW & MERGE PHASE                      │
│  Diff Viewer → Approval Gate → Git Operator             │
└─────────────────────────────────────────────────────────┘
```

---

## Data Contracts

### Run State Machine

```
queued → planning → sandboxing → validating → awaiting_approval
       → approved → applied
       → rejected
       → rolled_back
       → failed
```

### Core Entities

#### Run
```typescript
interface Run {
  run_id: string;           // UUID
  repo_id: string;
  graph_id: string;         // LangGraph state machine ID
  state: RunState;
  trigger: 'manual' | 'scheduled' | 'watcher' | 'self_improving';
  goal: string;             // Human-readable goal description
  estimated_cost: number;   // USD
  actual_cost: number;      // USD
  executor_type: 'local_docker' | 'e2b_firecracker';
  started_at: string;       // ISO 8601
  ended_at: string | null;
}
```

#### Approval
```typescript
interface Approval {
  approval_id: string;
  run_id: string;
  risk_score: number;           // 0.0–1.0
  breaking_change_score: number; // 0.0–1.0
  confidence_score: number;      // 0.0–1.0
  test_pass_rate: number;        // 0.0–1.0
  diff_ref: string;              // Reference to diff artifact
  decision: 'pending' | 'approved' | 'rejected' | 'expired';
  decided_by: 'human' | 'auto_policy';
  decided_at: string | null;
  expires_at: string;
}
```

#### Provenance
```typescript
interface Provenance {
  provenance_id: string;
  run_id: string;
  file_path: string;
  snippet_hash: string;     // SHA256 of the modified snippet
  source_type: 'commit_history' | 'trending_repo' | 'ai_generated';
  source_uri: string | null;
  license: string | null;
  model: string;            // Model identifier used
  prompt_hash: string;      // SHA256 of the prompt
  lineage_parent: string | null; // Parent provenance_id for derivations
  migration_cost_score: number;  // Estimated future migration effort
}
```

#### AuditEvent
```typescript
interface AuditEvent {
  event_id: string;
  run_id: string;
  node_name: string;        // LangGraph node name
  from_state: RunState;
  to_state: RunState;
  actor_type: 'agent' | 'human' | 'policy' | 'system';
  artifact_refs: string[];  // References to sandbox artifacts
  budget_decision: BudgetDecision | null;
  timestamp: string;
}
```

#### Snapshot
```typescript
interface Snapshot {
  snapshot_id: string;
  repo_id: string;
  run_id: string;
  git_ref: string;          // Git commit SHA at snapshot time
  created_at: string;
  restore_tested: boolean;
  restore_status: 'untested' | 'verified' | 'failed';
}
```

#### SkillsEntry
```typescript
interface SkillsEntry {
  skill_id: string;
  repo_id: string;
  skill_type: 'api_usage' | 'error_handling' | 'test_pattern' | 'architectural_invariant';
  pattern_description: string;
  source_commits: string[];    // Git SHAs where pattern was observed
  embedding: number[];         // pgvector embedding for semantic search
  confidence: number;          // 0.0–1.0, improves with more observations
  last_seen_at: string;
  created_at: string;
}
```

---

## Agent Specifications

### Apprentice Agent
- **Input:** Repo path, git log (last N commits), current task description
- **Process:** Extracts patterns via AST analysis of changed files, clusters by type, generates skill embeddings
- **Output:** Array of `SkillsEntry` objects inserted into pgvector DB
- **Model:** `balanced` (local mid or cloud balanced based on repo size)
- **Checkpoint:** After skills DB write completes

### Structured Action Executor
- **Input:** Planner output (list of structured edits targeting AST node IDs)
- **Process:** Loads file into tree-sitter, locates target node, applies edit, serializes back to file
- **Output:** Deterministic patch/diff with zero ambiguity about which code block was modified
- **Constraint:** MUST NOT use string replacement. All edits go through tree-sitter node mutation APIs.
- **Checkpoint:** After each file edit, before next file

---

## LangGraph State Machine

```python
# Simplified graph definition
from langgraph.graph import StateGraph, END

class RepoForgeState(TypedDict):
    run_id: str
    goal: str
    repo_path: str
    skills: list[SkillsEntry]
    plan: list[StructuredAction]
    sandbox_result: SandboxResult | None
    approval: Approval | None
    budget_remaining: float

graph = StateGraph(RepoForgeState)
graph.add_node("apprentice", apprentice_node)
graph.add_node("planner", planner_node)
graph.add_node("executor", executor_node)
graph.add_node("sandbox", sandbox_node)
graph.add_node("approval_gate", approval_gate_node)  # HITL interrupt
graph.add_node("git_operator", git_operator_node)

graph.set_entry_point("apprentice")
graph.add_edge("apprentice", "planner")
graph.add_edge("planner", "executor")
graph.add_edge("executor", "sandbox")
graph.add_conditional_edges(
    "sandbox",
    route_after_sandbox,  # checks risk scores, confidence, budget
    {
        "needs_approval": "approval_gate",
        "auto_apply": "git_operator",
        "failed": END
    }
)
graph.add_edge("approval_gate", "git_operator")
graph.add_edge("git_operator", END)
```

---

## Budget Routing Policy

| Task Type | Default Route | Escalation Condition |
|---|---|---|
| `scan_triage` | `local_small` | never |
| `skills_extraction` | `local_mid` | repo > 10k files |
| `planning` | `cloud_strong` | always (high stakes) |
| `ast_editing` | `local_mid` | complexity > threshold |
| `sandbox_validation` | `local_small` | always |
| `final_review` | `cloud_strong` | before PR creation |

---

## Approval Thresholds

```yaml
approval_required_if:
  security_risk_score: > 0.3
  breaking_change_score: > 0.15
  confidence_score: < 0.85
  test_pass_rate: < 0.98
  provenance_score: < 0.8

auto_apply_if:
  all_scores_pass: true
  aggressiveness: "autonomous"
  repo_policy: allows_auto_apply
```
