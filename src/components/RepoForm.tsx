import { useState } from "react";
import { registerRepo, type Repo } from "../api";

export default function RepoForm() {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [registered, setRegistered] = useState<Repo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const repo = await registerRepo(name.trim(), path.trim());
      setRegistered(repo);
      setName("");
      setPath("");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16, color: "#f1f5f9" }}>Register Repository</h2>

      <form
        onSubmit={(e) => void submit(e)}
        style={{
          background: "#1e293b",
          border: "1px solid #334155",
          borderRadius: 8,
          padding: 20,
          maxWidth: 480,
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

        {error && <p style={{ color: "#ef4444", fontSize: 13 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{ background: "#38bdf8", color: "#0f172a", alignSelf: "flex-start" }}
        >
          {loading ? "Registering…" : "Register"}
        </button>
      </form>

      {registered && (
        <div
          style={{
            marginTop: 16,
            background: "#052e16",
            border: "1px solid #166534",
            borderRadius: 8,
            padding: "12px 16px",
            maxWidth: 480,
          }}
        >
          <p style={{ color: "#4ade80", fontSize: 13, marginBottom: 4 }}>
            ✓ Registered <strong>{registered.name}</strong>
          </p>
          <p style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>
            ID: {registered.repo_id}
          </p>
        </div>
      )}
    </div>
  );
}
