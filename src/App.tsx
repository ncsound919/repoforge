import { useAppStore } from "./store";
import RunList from "./components/RunList";
import RepoForm from "./components/RepoForm";
import ApprovalQueue from "./components/ApprovalQueue";
import { Toast } from "./components/ui/Toast";
import { WorkerStatusBar } from "./components/ui/WorkerStatusBar";
import { Badge } from "./components/ui/Badge";

const TABS = [
  { id: "runs",      label: "Runs" },
  { id: "repos",     label: "Repos" },
  { id: "approvals", label: "Approvals" },
] as const;

export default function App() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const pendingCount = useAppStore((s) => s.pendingApprovalCount);

  return (
    <div className="flex flex-col h-screen">
      {/* ── Header ── */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center gap-6 flex-shrink-0">
        <span className="font-bold text-lg text-sky-400 tracking-tight">
          🔨 RepoForge
        </span>

        <nav className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-slate-950 text-sky-400 border border-slate-700"
                  : "bg-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {label}
              {id === "approvals" && pendingCount > 0 && (
                <Badge variant="orange" className="ml-1.5">
                  {pendingCount}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <WorkerStatusBar />
          <span className="text-xs text-slate-600">v0.6.0</span>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto p-6">
        {tab === "runs"      && <RunList />}
        {tab === "repos"     && <RepoForm />}
        {tab === "approvals" && <ApprovalQueue />}
      </main>

      <Toast />
    </div>
  );
}
