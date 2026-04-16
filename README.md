# RepoForge 🔨

> **Local-first autonomous repo evolution engine** — AST-aware agents, LangGraph orchestration, sandboxed execution, and human-in-the-loop approvals.

[![version](https://img.shields.io/badge/version-0.4.0-blue)](https://github.com/ncsound919/repoforge)
[![status](https://img.shields.io/badge/status-active_development-green)]()
[![license](https://img.shields.io/badge/license-MIT-orange)](LICENSE)

---

## What is RepoForge?

RepoForge is a background development platform where autonomous agents **learn** from your repository's history and generate code that feels native — not applied. It goes beyond simple code generation by building a persistent "skills" memory from your commit history, then using AST-level edits to apply changes with surgical precision.

## Core Principles

| Principle | Meaning |
|---|---|
| `local_first` | All data stays on-device by default |
| `human_in_the_loop` | Every risky action requires an approval gate |
| `sandbox_before_replace` | All changes run in isolated microVMs first |
| `learning_before_acting` | Apprentice agent studies history before any task |
| `ast_over_strings` | Code edits target AST nodes, not brittle string replacement |
| `budget_aware_routing` | Local models for simple tasks, cloud for complex ones |
| `rollback_everything` | Every state transition is reversible |
| `audit_every_action` | Full provenance on every generated/adopted artifact |

---

## Architecture (v0.4.0)

```
Learn: Ingest → AST Parser (tree-sitter) → Apprentice Agent → Skills DB (pgvector)
Plan:  User Goal → Orchestrator → Planner (Skills DB context) → Structured Action Executor
Act:   Executor → Sandbox (E2B/Firecracker) → Diff Viewer → Approval Gate → Git Operator
```

### Agent Registry

| Agent | Role | Default Model |
|---|---|---|
| **Coordinator** | LangGraph supervisor, budget/HITL enforcer | `cloud_strong` |
| **Apprentice** | Repository learner, skills DB builder | `balanced` |
| **Planner** | AST-aware structured task decomposer | `cloud_strong` |
| **Structured Action Executor** | AST-node-level code editor | `balanced` |
| **Sandbox Runner** | E2B/Firecracker executor, artifact capture | `local_small` |
| **Tester** | Test runner and benchmark evaluator | `local_small` |
| **Git Operator** | Branch creation, commits, PR management | `local_small` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Tauri 2 (Rust core, system tray, sidecars) |
| Orchestration | LangGraph (Python worker, stateful graphs, checkpointing) |
| AST Parsing | tree-sitter (Rust, multi-language) |
| Sandboxing | E2B / Firecracker microVMs |
| Database | PostgreSQL + pgvector + Redis |
| Local Models | Ollama sidecar |
| Frontend | React + react-diff-viewer-continued |

---

## Phases

### Phase 1 — Foundation & Learning (Weeks 1–4)
- tree-sitter AST integration
- Apprentice agent + skills DB
- Structured Action Executor
- Repo ingestion pipeline

### Phase 2 — Assisted Evolution (Weeks 4–6)
- Orchestrator + Planner integration with skills DB
- E2B/Firecracker sandbox + approval queue with AST diffs
- End-to-end goal → sandbox-validated PR flow
- Provenance tracking (per-run + per-snippet)

### Phase 3 — Autonomous Agentic Workflows (Weeks 6–10+)
- Full LangGraph state machine with checkpointing
- Budget-aware routing (local ↔ cloud)
- Cloud dashboard for fleet management
- Self-improvement loop from audit metrics

---

## Getting Started

```bash
# Clone
git clone https://github.com/ncsound919/repoforge.git
cd repoforge

# Install Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Tauri CLI
cargo install tauri-cli

# Install Python worker dependencies
cd worker && pip install -r requirements.txt

# Run development
cargo tauri dev
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). All agents, schemas, and state machines follow the contracts defined in [docs/architecture.md](docs/architecture.md).

---

## License

MIT © 2026 Overlay Eco / Overlay365
