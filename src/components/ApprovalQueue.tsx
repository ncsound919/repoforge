import { useEffect, useState } from "react";
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

  const load = () =>
    listApprovals()
      .then(setApprovals)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
    const id = setInterval(load, 3000);
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
      <h2 style={{ marginBottom: 16, color: "#f1f5f9" }}>Approval Queue</h2>

      {error && (
        <p style={{ color: "#ef4444", marginBottom: 12, fontSize: 14 }}>{error}</p>
      )}

      {pending.length === 0 && (
        <p style={{ color: "#64748b", marginBottom: 24 }}>No pending approvals.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
        {pending.map((a) => (
          <div
            key={a.approval_id}
            style={{
              background: "#1e293b",
              border: "1px solid #f97316",
              borderRadius: 8,
              padding: "16px 20px",
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
              <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "monospace" }}>
                Run: {a.run_id.slice(0, 8)}…
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#f97316",
                  background: "#7c2d1244",
                  padding: "2px 8px",
                  borderRadius: 99,
                  border: "1px solid #f9731655",
                }}
              >
                PENDING
              </span>
            </div>

            <ScoreBar label="Risk" value={a.risk_score} />
            <ScoreBar label="Breaking change" value={a.breaking_change_score} />
            <ScoreBar label="Confidence" value={a.confidence_score} />
            <ScoreBar label="Test pass rate" value={a.test_pass_rate} />

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => void decide(a.approval_id, "approved")}
                style={{ background: "#166534", color: "#4ade80" }}
              >
                ✓ Approve
              </button>
              <button
                onClick={() => void decide(a.approval_id, "rejected")}
                style={{ background: "#7f1d1d", color: "#fca5a5" }}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {resolved.length > 0 && (
        <>
          <h3 style={{ color: "#64748b", fontSize: 14, marginBottom: 8 }}>
            Resolved ({resolved.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {resolved.map((a) => (
              <div
                key={a.approval_id}
                style={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 6,
                  padding: "8px 14px",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  fontSize: 13,
                  color: "#94a3b8",
                }}
              >
                <span style={{ fontFamily: "monospace" }}>{a.run_id.slice(0, 8)}…</span>
                <span
                  style={{
                    color: a.decision === "approved" ? "#22c55e" : "#ef4444",
                    textTransform: "capitalize",
                    fontWeight: 600,
                  }}
                >
                  {a.decision}
                </span>
                <span style={{ marginLeft: "auto", fontSize: 11 }}>
                  by {a.decided_by}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
