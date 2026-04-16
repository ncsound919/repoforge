import { useEffect, useRef, useState } from "react";
import { listApprovals, decideApproval, type Approval } from "../api";

function riskColor(score: number) {
  if (score >= 0.7) return "#ef4444";
  if (score >= 0.3) return "#f97316";
  return "#22c55e";
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          color: "#94a3b8",
          marginBottom: 2,
        }}
      >
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 99,
          background: "#334155",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: riskColor(value),
            borderRadius: 99,
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const data = await listApprovals();
      setApprovals(data);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => { void load(); }, 3000);
    return () => clearInterval(id);
  }, []);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    try {
      await decideApproval(id, decision);
      await load();
    } catch (e: unknown) {
      setError((e as Error).message);
    }
  };

  const pending = approvals.filter((a) => a.decision === "pending");
  const resolved = approvals.filter((a) => a.decision !== "pending");

  return (
    <div>
      <h2>Approval Queue</h2>

      {error && (
        <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
      )}

      {pending.length === 0 && (
        <p style={{ color: "#94a3b8" }}>No pending approvals.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {pending.map((a) => (
          <li
            key={a.approval_id}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span>
                Run: <code style={{ fontSize: 11 }}>{a.run_id.slice(0, 8)}&hellip;</code>
                &nbsp;&nbsp;
                <span
                  style={{
                    background: "#f97316",
                    color: "#fff",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}
                >
                  PENDING
                </span>
              </span>
              <span style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => void decide(a.approval_id, "approved")}
                  style={{ background: "#166534", color: "#4ade80" }}
                >
                  &#10003; Approve
                </button>
                <button
                  onClick={() => void decide(a.approval_id, "rejected")}
                  style={{ background: "#7f1d1d", color: "#fca5a5" }}
                >
                  &#10007; Reject
                </button>
              </span>
            </div>
            <ScoreBar label="Risk" value={a.scores.risk} />
            <ScoreBar label="Breaking Change" value={a.scores.breaking_change} />
            <ScoreBar label="Confidence" value={a.scores.confidence} />
            <ScoreBar label="Test Pass Rate" value={a.scores.test_pass_rate} />
          </li>
        ))}
      </ul>

      {resolved.length > 0 && (
        <>
          <h3>Resolved ({resolved.length})</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {resolved.map((a) => (
              <li
                key={a.approval_id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "8px 12px",
                  marginBottom: 6,
                  background: "#1e293b",
                  borderRadius: 8,
                  border: "1px solid #334155",
                  fontSize: 13,
                }}
              >
                <code style={{ fontSize: 11 }}>{a.run_id.slice(0, 8)}&hellip;</code>
                &nbsp;&nbsp;
                <span style={{ color: a.decision === "approved" ? "#4ade80" : "#f87171" }}>
                  {a.decision}
                </span>
                &nbsp;&nbsp;
                <span style={{ color: "#94a3b8" }}>by {a.decided_by}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
