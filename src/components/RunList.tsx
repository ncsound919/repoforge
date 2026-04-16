import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { listRuns, createRun, cancelRun, listRepos, type Run, type Repo } from "../api";
import { RunSkeleton } from "./Skeleton";

const STATE_COLORS: Record<string, string> = {
  queued: "#64748b",
  planning: "#f59e0b",
  sandboxing: "#8b5cf6",
  validating: "#3b82f6",
  awaiting_approval: "#f97316",
  approved: "#10b981",
  applied: "#22c55e",
  rejected: "#ef4444",
  rolled_back: "#ef4444",
  failed: "#ef4444",
};

function StatusBadge({ state }: { state: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: (STATE_COLORS[state] ?? "#64748b") + "33",
        color: STATE_COLORS[state] ?? "#64748b",
        border: `1px solid ${STATE_COLORS[state] ?? "#64748b"}55`,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCost(val: number) {
  if (!val) return null;
  return `$${val.toFixed(4)}`;
}

export default function RunList() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoId, setRepoId] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await listRuns();
      setRuns(data);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setInitialLoad(false);
    }
  };

  const loadRepos = async () => {
    try {
      const data = await listRepos();
      setRepos(data);
      if (data.length > 0) {
        setRepoId((currentRepoId) => currentRepoId || data[0].repo_id);
      }
    } catch {
      // non-fatal — user can still type
    }
  };

  useEffect(() => {
    void load();
    void loadRepos();
    const id = setInterval(() => { void load(); }, 5000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!repoId.trim() || !goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createRun(repoId.trim(), goal.trim());
      setGoal("");
      await load();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (runId: string) => {
    try {
      await cancelRun(runId);
      await load();
    } catch (err: unknown) {
      setError((err as Error).message);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16, color: "#f1f5f9" }}>Runs</h2>

      {/* New run form */}
      <form
        onSubmit={(e) => void submit(e)}
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          background: "#1e293b",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #334155",
          flexWrap: "wrap",
        }}
      >
        {repos.length > 0 ? (
          <select
            value={repoId}
            onChange={(e) => setRepoId(e.target.value)}
            style={{ flex: "0 0 260px" }}
            required
          >
            {repos.map((r) => (
              <option key={r.repo_id} value={r.repo_id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            placeholder="Repo ID"
            value={repoId}
            onChange={(e) => setRepoId(e.target.value)}
            style={{ flex: "0 0 260px" }}
            required
          />
        )}
        <input
          placeholder="Goal — e.g. Add test coverage to auth module"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
          required
        />
        <button type="submit" disabled={loading} style={{ flexShrink: 0 }}>
          {loading ? "Creating…" : "New Run"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
      )}

      {/* Skeleton on initial load */}
      {initialLoad && (
        <div>
          {[1, 2, 3].map((i) => <RunSkeleton key={i} />)}
        </div>
      )}

      {!initialLoad && runs.length === 0 && (
        <p style={{ color: "#94a3b8" }}>No runs yet. Create one above.</p>
      )}

      {!initialLoad && runs.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {runs.map((run) => (
            <li
              key={run.run_id}
              style={{
                padding: "14px 16px",
                marginBottom: 8,
                background: "#1e293b",
                borderRadius: 8,
                border: "1px solid #334155",
              }}
            >
              {/* Top row: goal + status + cancel */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ flex: 1, fontWeight: 500 }}>{run.goal}</span>
                <StatusBadge state={run.state} />
                {!["applied", "failed", "rolled_back", "rejected"].includes(run.state) && (
                  <button
                    onClick={() => void cancel(run.run_id)}
                    style={{
                      background: "#7f1d1d",
                      color: "#fca5a5",
                      padding: "4px 10px",
                      fontSize: 12,
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Bottom row: metadata */}
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                <span>
                  <span style={{ color: "#475569" }}>ID </span>
                  <code style={{ fontSize: 11 }}>{run.run_id.slice(0, 8)}</code>
                </span>
                <span>
                  <span style={{ color: "#475569" }}>trigger </span>{run.trigger}
                </span>
                <span>
                  <span style={{ color: "#475569" }}>started </span>{formatDate(run.started_at)}
                </span>
                {run.ended_at && (
                  <span>
                    <span style={{ color: "#475569" }}>ended </span>{formatDate(run.ended_at)}
                  </span>
                )}
                {formatCost(run.actual_cost ?? run.estimated_cost) && (
                  <span style={{ color: "#a78bfa" }}>
                    {run.actual_cost
                      ? `actual ${formatCost(run.actual_cost) ?? ""}`
                      : `est. ${formatCost(run.estimated_cost) ?? ""}`}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
