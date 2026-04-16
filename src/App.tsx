import { useState } from "react";
import RunList from "./components/RunList";
import RepoForm from "./components/RepoForm";
import ApprovalQueue from "./components/ApprovalQueue";

type Tab = "runs" | "repos" | "approvals";

const TABS: { id: Tab; label: string }[] = [
  { id: "runs", label: "Runs" },
  { id: "repos", label: "Repos" },
  { id: "approvals", label: "Approvals" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("runs");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          background: "#1e293b",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
          borderBottom: "1px solid #334155",
          flexShrink: 0,
        }}
      >
        <span
          style={{ fontWeight: 700, fontSize: 18, color: "#38bdf8", letterSpacing: -0.5 }}
        >
          🔨 RepoForge
        </span>

        <nav style={{ display: "flex", gap: 4 }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                background: tab === id ? "#0f172a" : "transparent",
                color: tab === id ? "#38bdf8" : "#94a3b8",
                border: tab === id ? "1px solid #334155" : "1px solid transparent",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              {label}
            </button>
          ))}
        </nav>

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748b" }}>
          v0.5.0
        </span>
      </header>

      <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
        {tab === "runs" && <RunList />}
        {tab === "repos" && <RepoForm />}
        {tab === "approvals" && <ApprovalQueue />}
      </main>
    </div>
  );
}
