-- RepoForge Initial Schema
-- Requires: pgvector extension

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Repositories
CREATE TABLE IF NOT EXISTS repositories (
    repo_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          TEXT NOT NULL,
    path          TEXT NOT NULL UNIQUE,
    language      TEXT[],
    ingested_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Skills Database (with pgvector embedding)
CREATE TABLE IF NOT EXISTS skills (
    skill_id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id             UUID REFERENCES repositories(repo_id) ON DELETE CASCADE,
    skill_type          TEXT NOT NULL CHECK (skill_type IN ('api_usage','error_handling','test_pattern','architectural_invariant')),
    pattern_description TEXT NOT NULL,
    source_commits      TEXT[],
    embedding           vector(1536),   -- OpenAI/Ollama embedding dimension
    confidence          FLOAT DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
    last_seen_at        TIMESTAMPTZ DEFAULT NOW(),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS skills_embedding_idx ON skills USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS skills_repo_type_idx ON skills(repo_id, skill_type);

-- Runs
CREATE TABLE IF NOT EXISTS runs (
    run_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id         UUID REFERENCES repositories(repo_id) ON DELETE CASCADE,
    graph_id        TEXT,
    state           TEXT NOT NULL DEFAULT 'queued',
    trigger         TEXT NOT NULL DEFAULT 'manual',
    goal            TEXT NOT NULL,
    estimated_cost  NUMERIC(10,6) DEFAULT 0,
    actual_cost     NUMERIC(10,6) DEFAULT 0,
    executor_type   TEXT DEFAULT 'local_docker',
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ
);

-- Approvals
CREATE TABLE IF NOT EXISTS approvals (
    approval_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id                UUID REFERENCES runs(run_id) ON DELETE CASCADE,
    risk_score            FLOAT,
    breaking_change_score FLOAT,
    confidence_score      FLOAT,
    test_pass_rate        FLOAT,
    diff_ref              TEXT,
    decision              TEXT DEFAULT 'pending',
    decided_by            TEXT DEFAULT 'human',
    decided_at            TIMESTAMPTZ,
    expires_at            TIMESTAMPTZ NOT NULL
);

-- Provenance (append-only)
CREATE TABLE IF NOT EXISTS provenance (
    provenance_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id               UUID REFERENCES runs(run_id) ON DELETE CASCADE,
    file_path            TEXT NOT NULL,
    snippet_hash         TEXT NOT NULL,
    source_type          TEXT NOT NULL CHECK (source_type IN ('commit_history','trending_repo','ai_generated')),
    source_uri           TEXT,
    license              TEXT,
    model                TEXT NOT NULL,
    prompt_hash          TEXT NOT NULL,
    lineage_parent       UUID REFERENCES provenance(provenance_id),
    migration_cost_score FLOAT DEFAULT 0,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Events (append-only)
CREATE TABLE IF NOT EXISTS audit_events (
    event_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id           UUID REFERENCES runs(run_id) ON DELETE CASCADE,
    node_name        TEXT NOT NULL,
    from_state       TEXT NOT NULL,
    to_state         TEXT NOT NULL,
    actor_type       TEXT NOT NULL,
    artifact_refs    TEXT[],
    budget_decision  JSONB,
    timestamp        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_run_idx ON audit_events(run_id, timestamp);

-- Snapshots
CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id         UUID REFERENCES repositories(repo_id) ON DELETE CASCADE,
    run_id          UUID REFERENCES runs(run_id),
    git_ref         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    restore_tested  BOOLEAN DEFAULT FALSE,
    restore_status  TEXT DEFAULT 'untested'
);
