import { useState } from "react";
import type { FormEvent } from "react";
import { useRepos, useRegisterRepo } from "../hooks/useRepoForgeQueries";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Skeleton } from "./Skeleton";

function IngestBadge({ ingestedAt }: { ingestedAt: string | null }) {
  if (!ingestedAt) return <Badge variant="muted">not ingested</Badge>;
  return (
    <Badge variant="success">
      ✓ ingested {new Date(ingestedAt).toLocaleDateString()}
    </Badge>
  );
}

export default function RepoForm() {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");

  const { data: repos = [], isLoading: reposLoading } = useRepos();
  const register = useRegisterRepo();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !path.trim()) return;
    register.mutate({ name: name.trim(), path: path.trim() });
    setName("");
    setPath("");
  };

  return (
    <div className="flex gap-8 flex-wrap items-start">

      {/* ── Register form ── */}
      <div className="flex-none w-80">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Register Repository</h2>
        <Card>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-slate-400 text-sm">
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-repo"
                required
                className="mt-1"
              />
            </label>
            <label className="text-slate-400 text-sm">
              Local path
              <input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/home/user/projects/my-repo"
                required
                className="mt-1"
              />
            </label>
            <Button type="submit" disabled={register.isPending}>
              {register.isPending ? "Registering…" : "Register"}
            </Button>
          </form>
        </Card>
      </div>

      {/* ── Repo list ── */}
      <div className="flex-1 min-w-64">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Registered Repos</h2>

        {reposLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <Skeleton className="h-3.5 w-1/2 mb-2" />
                <Skeleton className="h-3 w-1/3" />
              </Card>
            ))}
          </div>
        )}

        {!reposLoading && repos.length === 0 && (
          <p className="text-slate-500 text-sm">No repos registered yet.</p>
        )}

        {!reposLoading && repos.length > 0 && (
          <ul className="space-y-2 list-none p-0 m-0">
            {repos.map((r) => (
              <li key={r.repo_id}>
                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-slate-100">{r.name}</span>
                    <IngestBadge ingestedAt={r.ingested_at} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>
                      <span className="text-slate-600">ID </span>
                      <code className="text-[11px]">{r.repo_id.slice(0, 8)}</code>
                    </span>
                    <span>
                      <span className="text-slate-600">path </span>{r.path}
                    </span>
                    {r.language.length > 0 && (
                      <span>
                        <span className="text-slate-600">lang </span>{r.language.join(", ")}
                      </span>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
