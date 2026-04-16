import { useEffect, useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { useApprovals, useDecideApproval } from "../hooks/useRepoForgeQueries";
import { getDiff } from "../api";
import { Card, CardHeader, CardContent } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ScoreProgress } from "./ui/Progress";
import { ApprovalSkeleton } from "./Skeleton";
import type { Approval } from "../api";

// ── Expiry countdown ─────────────────────────────────────────────────────────
function ExpiryBadge({ expiresAt }: { expiresAt: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setLabel("expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`expires in ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <Badge variant={label === "expired" ? "danger" : "primary"}>
      ⏱ {label}
    </Badge>
  );
}

// ── Lazy diff panel ───────────────────────────────────────────────────────────
function DiffPanel({ diffRef }: { diffRef: string }) {
  const [oldContent, setOldContent] = useState<string | null>(null);
  const [newContent, setNewContent] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    if (oldContent !== null) { setOpen(true); return; }
    setLoading(true);
    setDiffError(null);
    try {
      const data = await getDiff(diffRef);
      setOldContent(data.old_content);
      setNewContent(data.new_content);
      setFilename(data.filename);
      setOpen(true);
    } catch (e: unknown) {
      setDiffError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <Button variant="ghost" size="sm" onClick={() => void toggle()} disabled={loading}>
        {loading ? "Loading diff…" : open ? "▲ Hide diff" : "▼ Show diff"}
      </Button>
      {diffError && <p className="text-red-400 text-xs mt-1">{diffError}</p>}
      {open && oldContent !== null && newContent !== null && (
        <div className="mt-2 rounded-md overflow-hidden border border-slate-700 text-xs">
          {filename && (
            <div className="bg-slate-950 px-3 py-1.5 text-slate-400 text-[11px] border-b border-slate-700">
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

// ── Pending approval card ─────────────────────────────────────────────────────
function PendingCard({ a }: { a: Approval }) {
  const decide = useDecideApproval();
  return (
    <Card className="mb-3">
      <CardHeader>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">
            Run: <code className="text-[11px] text-slate-400">{a.run_id.slice(0, 8)}&hellip;</code>
          </span>
          <Badge variant="orange">PENDING</Badge>
          <ExpiryBadge expiresAt={a.expires_at} />
        </div>
        <div className="flex gap-2">
          <Button
            variant="success"
            size="sm"
            disabled={decide.isPending}
            onClick={() => decide.mutate({ id: a.approval_id, decision: "approved" })}
          >
            ✓ Approve
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={decide.isPending}
            onClick={() => decide.mutate({ id: a.approval_id, decision: "rejected" })}
          >
            ✗ Reject
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScoreProgress label="Risk"           value={a.risk_score} />
        <ScoreProgress label="Breaking Change" value={a.breaking_change_score} />
        <ScoreProgress label="Confidence"      value={a.confidence_score} />
        <ScoreProgress label="Test Pass Rate"  value={a.test_pass_rate} />
        {a.diff_ref && <DiffPanel diffRef={a.diff_ref} />}
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApprovalQueue() {
  const { data: approvals = [], isLoading, isError, error } = useApprovals();

  const pending  = approvals.filter((a) => a.decision === "pending");
  const resolved = approvals.filter((a) => a.decision !== "pending");

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-100 mb-4">Approval Queue</h2>

      {isError && <p className="text-red-400 text-sm mb-4">{(error as Error).message}</p>}

      {isLoading && [1, 2].map((i) => <ApprovalSkeleton key={i} />)}

      {!isLoading && pending.length === 0 && (
        <p className="text-slate-500">No pending approvals.</p>
      )}

      {pending.map((a) => <PendingCard key={a.approval_id} a={a} />)}

      {resolved.length > 0 && (
        <>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-6 mb-2">
            Resolved ({resolved.length})
          </h3>
          <ul className="space-y-1.5 list-none p-0 m-0">
            {resolved.map((a) => (
              <li key={a.approval_id}>
                <Card className="flex flex-wrap items-center gap-3 py-2.5 px-3.5 text-sm">
                  <code className="text-[11px] text-slate-500">{a.run_id.slice(0, 8)}&hellip;</code>
                  <span className={a.decision === "approved" ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                    {a.decision}
                  </span>
                  <span className="text-slate-500">by {a.decided_by}</span>
                  <span className="text-slate-600 text-[11px] ml-auto">
                    risk {Math.round(a.risk_score * 100)}% &middot;
                    confidence {Math.round(a.confidence_score * 100)}% &middot;
                    tests {Math.round(a.test_pass_rate * 100)}%
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
