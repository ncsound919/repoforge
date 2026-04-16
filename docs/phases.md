# RepoForge — Phased Implementation Plan

## Phase 1: Foundation & Learning (Weeks 1–4)

**Goal:** Build the core learning loop and AST-powered analysis engine.

### Backlog
- [ ] Integrate **tree-sitter** to build a live AST index of the target repo (multi-language: TS, JS, Python)
- [ ] Develop the **Apprentice agent** that analyzes historical commits and extracts skill patterns
- [ ] Build the **skills database** using `pgvector` for semantic search over learned patterns
- [ ] Build the **Structured Action Executor** that edits code via AST node targeting (no string replacement)
- [ ] Create the repo ingestion pipeline (clone → watch → index → skills extraction)
- [ ] Define all core data contracts (Run, Approval, Provenance, AuditEvent, Snapshot, SkillsEntry)
- [ ] Scaffold LangGraph Python worker with typed RepoForgeState
- [ ] Set up Postgres + pgvector + Redis infrastructure (Docker Compose for local dev)

### Success Criteria
- Ingestion pipeline completes on a mid-size repo (>500 files) without error
- Skills DB contains >20 extracted patterns after ingestion
- Structured Action Executor can modify a target function via AST node ID without side effects

---

## Phase 2: Assisted Evolution (Weeks 4–6)

**Goal:** Enable human-supervised, AST-driven code changes end-to-end.

### Backlog
- [ ] Integrate Orchestrator and Planner agents with skills DB context injection
- [ ] Implement Sandbox Executor (E2B/Firecracker) with artifact capture (logs, test results, diffs)
- [ ] Build Approval Queue UI: split/unified diff toggle, test summary, provenance footer, model explanation
- [ ] Add Provenance tracking at two levels: per-run envelope + per-snippet records
- [ ] Implement HITL approval gate in LangGraph as a checkpoint interrupt
- [ ] Build end-to-end flow: high-level goal → planning → sandbox → diff → approval → PR
- [ ] Add rollback center: snapshot list, restore simulation, one-click restore
- [ ] Implement audit event emission on every state transition

### Success Criteria
- A discovery → plan → sandbox run → diff approval → branch creation completes end-to-end
- All risky actions (risk_score > 0.3) require explicit approval
- Provenance visible at both run and snippet level in the UI
- Rollback restores repo cleanly with full audit trail

---

## Phase 3: Autonomous Agentic Workflows (Weeks 6–10+)

**Goal:** Enable fully autonomous, budget-aware, self-improving repo evolution.

### Backlog
- [ ] Implement full LangGraph state machine with checkpointing for long-running tasks (>30min)
- [ ] Add **budget-aware routing**: local (Ollama) for simple tasks, cloud for complex ones, pre-run estimation
- [ ] Build dynamic model routing engine with confidence-based escalation
- [ ] Develop Cloud Dashboard for fleet management, cost reporting, shared discoveries, remote controls
- [ ] Integrate self-improvement loop: audit metrics → meta-refiner → prompt refinement
- [ ] Add remote notification hooks (Slack/Telegram) for approval requests
- [ ] Build multi-repo management views with health board
- [ ] Add configurable aggressiveness policies per repo

### Success Criteria
- A complex run (discovery → skills extraction → planning → execution → testing) completes autonomously under budget
- Coordinator visual graph shows live state and budget decisions
- Self-improvement loop demonstrably improves planning quality over 5+ runs
- Cloud dashboard syncs activity without compromising local-first privacy
