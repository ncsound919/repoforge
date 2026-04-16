import { useEffect, useState } from "react";
import { listRuns, createRun, cancelRun, type Run } from "../api";

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
      }}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}

export default function RunList() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [repoId, setRepoId] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    listRuns()
      .then(setRuns)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoId.trim() || !goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createRun(repoId.trim(), goal.trim());
      setRepoId("");
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
        }}
      >
        <input
          placeholder="Repo ID"
          value={repoId}
          onChange={(e) => setRepoId(e.target.value)}
          style={{ flex: "0 0 260px" }}
          required
        />
        <input
          placeholder="Goal — e.g. Add test coverage to auth module"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{ flex: 1 }}
          required
        />
        <button
          type="submit"
          disabled={loading}
          style={{ background: "#38bdf8", color: "#0f172a", flexShrink: 0 }}
        >
          {loading ? "Creating…" : "New Run"}
        </button>
      </form>

      {error && (
        <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 14 }}>{error}</p>
      )}

      {/* Runs table */}
      {runs.length === 0 ? (
        <p style={{ color: "#64748b" }}>No runs yet. Create one above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {runs.map((run) => (
            <div
              key={run.run_id}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <StatusBadge state={run.state} />
              <span style={{ flex: 1, color: "#e2e8f0", fontSize: 14 }}>{run.goal}</span>
              <span style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
                {run.run_id.slice(0, 8)}
              </span>
              <span style={{ color: "#64748b", fontSize: 12 }}>{run.trigger}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
