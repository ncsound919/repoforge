import { useEffect, useRef, useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { listApprovals, getDiff, decideApproval, type Approval } from "../api";
import { ApprovalSkeleton } from "./Skeleton";

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

function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setLabel("expired");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`expires in ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const expired = label === "expired";
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 99,
        background: expired ? "#7f1d1d" : "#1e3a5f",
        color: expired ? "#fca5a5" : "#93c5fd",
        fontWeight: 500,
      }}
    >
      ⏱ {label}
    </span>
  );
}

interface DiffPanelProps {
  diffRef: string;
}

function DiffPanel({ diffRef }: DiffPanelProps) {
  const [oldContent, setOldContent] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    if (oldContent !== null) { setOpen(true); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await getDiff(diffRef);
      setOldContent(data.old_content);
      setNewContent(data.new_content);
      setFilename(data.filename);
      setOpen(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => void toggle()}
        disabled={loading}
        style={{
          background: "#0f172a",
          color: "#38bdf8",
          border: "1px solid #334155",
          fontSize: 12,
          padding: "4px 12px",
        }}
      >
        {loading ? "Loading diff…" : open ? "▲ Hide diff" : "▼ Show diff"}
      </button>
      {error && <p style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{error}</p>}
      {open && oldContent !== null && newContent !== null && (
        <div
          style={{
            marginTop: 8,
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid #334155",
            fontSize: 12,
          }}
        >
          {filename && (
            <div
              style={{
                background: "#0f172a",
                padding: "6px 12px",
                color: "#94a3b8",
                fontSize: 11,
                borderBottom: "1px solid #334155",
              }}
            >
              📄 {filename}
            </div>
          )}
          <ReactDiffViewer
            oldValue={oldContent}
            newValue={newContent}
            splitView={false}
            useDarkTheme
            hideLineNumbers={false}
          />
        </div>
      )}
    </div>
  );
}

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
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
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    void load();
    const id = setInterval(() => { void load(); }, 5000);
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
        <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>
      )}

      {initialLoad && (
        <div>
          {[1, 2].map((i) => <ApprovalSkeleton key={i} />)}
        </div>
      )}

      {!initialLoad && pending.length === 0 && (
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
            {/* Header row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>
                  Run: <code style={{ fontSize: 11 }}>{a.run_id.slice(0, 8)}&hellip;</code>
                </span>
                <span
                  style={{
                    background: "#f97316",
                    color: "#fff",
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 99,
                    fontWeight: 600,
                  }}
                >
                  PENDING
                </span>
                <ExpiryBadge expiresAt={a.expires_at} />
              </div>
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

            {/* Score bars — fixed field names */}
            <ScoreBar label="Risk" value={a.risk_score} />
            <ScoreBar label="Breaking Change" value={a.breaking_change_score} />
            <ScoreBar label="Confidence" value={a.confidence_score} />
            <ScoreBar label="Test Pass Rate" value={a.test_pass_rate} />

            {/* Diff viewer */}
            {a.diff_ref && <DiffPanel diffRef={a.diff_ref} />}
          </li>
        ))}
      </ul>

      {resolved.length > 0 && (
        <>
          <h3 style={{ color: "#94a3b8", margin: "24px 0 8px", fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Resolved ({resolved.length})
          </h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {resolved.map((a) => (
              <li
                key={a.approval_id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 14px",
                  marginBottom: 6,
                  background: "#1e293b",
                  borderRadius: 8,
                  border: "1px solid #334155",
                  fontSize: 13,
                  flexWrap: "wrap",
                }}
              >
                <code style={{ fontSize: 11, color: "#64748b" }}>{a.run_id.slice(0, 8)}&hellip;</code>
                <span style={{ color: a.decision === "approved" ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                  {a.decision}
                </span>
                <span style={{ color: "#64748b" }}>by {a.decided_by}</span>
                <span style={{ color: "#475569", fontSize: 11, marginLeft: "auto" }}>
                  risk {Math.round(a.risk_score * 100)}% &middot;
                  confidence {Math.round(a.confidence_score * 100)}% &middot;
                  tests {Math.round(a.test_pass_rate * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
