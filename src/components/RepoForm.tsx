import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { registerRepo, listRepos, type Repo } from "../api";
import { Skeleton } from "./Skeleton";

function IngestBadge({ ingestedAt }: { ingestedAt: string | null }) {
  if (!ingestedAt) {
    return (
      <span
        style={{
          fontSize: 11,
          padding: "2px 8px",
          borderRadius: 99,
          background: "#1c1917",
          color: "#a8a29e",
          border: "1px solid #44403c",
        }}
      >
        not ingested
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 99,
        background: "#14532d",
        color: "#4ade80",
        border: "1px solid #166534",
      }}
    >
      ✓ ingested {new Date(ingestedAt).toLocaleDateString()}
    </span>
  );
}

export default function RepoForm() {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [registered, setRegistered] = useState<Repo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reposLoading, setReposLoading] = useState(true);

  const loadRepos = async () => {
    setReposLoading(true);
    try {
      const data = await listRepos();
      setRepos(data);
    } catch {
      // non-fatal
    } finally {
      setReposLoading(false);
    }
  };

  useEffect(() => { void loadRepos(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const repo = await registerRepo(name.trim(), path.trim());
      setRegistered(repo);
      setName("");
      setPath("");
      await loadRepos();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>

      {/* Register form */}
      <div style={{ flex: "0 0 360px" }}>
        <h2 style={{ marginBottom: 16, color: "#f1f5f9" }}>Register Repository</h2>
        <form
          onSubmit={(e) => void submit(e)}
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 8,
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <label style={{ color: "#94a3b8", fontSize: 13 }}>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-repo"
              required
              style={{ marginTop: 4 }}
            />
          </label>

          <label style={{ color: "#94a3b8", fontSize: 13 }}>
            Local path
            <input
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/home/user/projects/my-repo"
              required
              style={{ marginTop: 4 }}
            />
          </label>

          {error && <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        {registered && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#14532d",
              border: "1px solid #166534",
              borderRadius: 8,
              color: "#4ade80",
            }}
          >
            <p style={{ margin: 0 }}>
              &#10003; Registered <strong>{registered.name}</strong>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#86efac" }}>
              ID: {registered.repo_id}
            </p>
          </div>
        )}
      </div>

      {/* Repo list */}
      <div style={{ flex: 1, minWidth: 280 }}>
        <h2 style={{ marginBottom: 16, color: "#f1f5f9" }}>Registered Repos</h2>

        {reposLoading && (
          <div>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: "#1e293b",
                  borderRadius: 8,
                  border: "1px solid #334155",
                }}
              >
                <Skeleton height={14} width="50%" mb={6} />
                <Skeleton height={11} width="30%" mb={0} />
              </div>
            ))}
          </div>
        )}

        {!reposLoading && repos.length === 0 && (
          <p style={{ color: "#64748b", fontSize: 14 }}>No repos registered yet.</p>
        )}

        {!reposLoading && repos.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {repos.map((r) => (
              <li
                key={r.repo_id}
                style={{
                  padding: "12px 16px",
                  marginBottom: 8,
                  background: "#1e293b",
                  borderRadius: 8,
                  border: "1px solid #334155",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{r.name}</span>
                  <IngestBadge ingestedAt={r.ingested_at} />
                </div>
                <div style={{ fontSize: 12, color: "#64748b", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span>
                    <span style={{ color: "#475569" }}>ID </span>
                    <code style={{ fontSize: 11 }}>{r.repo_id.slice(0, 8)}</code>
                  </span>
                  <span>
                    <span style={{ color: "#475569" }}>path </span>{r.path}
                  </span>
                  {r.language.length > 0 && (
                    <span>
                      <span style={{ color: "#475569" }}>lang </span>{r.language.join(", ")}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
