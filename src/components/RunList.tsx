import { useState } from "react";
import type { FormEvent } from "react";
import { useRuns, useRepos, useCreateRun, useCancelRun } from "../hooks/useRepoForgeQueries";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { RunSkeleton } from "./Skeleton";
import { formatDate, formatCost } from "../lib/utils";

const STATE_VARIANT: Record<string, "muted" | "warning" | "purple" | "primary" | "success" | "danger" | "orange"> = {
  queued:            "muted",
  planning:          "warning",
  sandboxing:        "purple",
  validating:        "primary",
  awaiting_approval: "orange",
  approved:          "success",
  applied:           "success",
  rejected:          "danger",
  rolled_back:       "danger",
  failed:            "danger",
};

export default function RunList() {
  const [repoId, setRepoId] = useState("");
  const [goal, setGoal] = useState("");

  const { data: runs = [], isLoading, isError, error } = useRuns();
  const { data: repos = [] } = useRepos();
  const createRun = useCreateRun();
  const cancelRun = useCancelRun();

  // Auto-select first repo when repos load
  const selectedRepoId = repoId || (repos[0]?.repo_id ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId || !goal.trim()) return;
    createRun.mutate({ repoId: selectedRepoId, goal: goal.trim() });
    setGoal("");
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-100 mb-4">Runs</h2>

      {/* New run form */}
      <Card className="mb-6">
        <form onSubmit={submit} className="flex gap-2 flex-wrap">
          {repos.length > 0 ? (
            <select
              value={selectedRepoId}
              onChange={(e) => setRepoId(e.target.value)}
              className="flex-none w-56"
              required
            >
              {repos.map((r) => (
                <option key={r.repo_id} value={r.repo_id}>{r.name}</option>
              ))}
            </select>
          ) : (
            <input
              placeholder="Repo ID"
              value={repoId}
              onChange={(e) => setRepoId(e.target.value)}
              className="flex-none w-56"
              required
            />
          )}
          <input
            placeholder="Goal — e.g. Add test coverage to auth module"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="flex-1 min-w-48"
            required
          />
          <Button type="submit" disabled={createRun.isPending}>
            {createRun.isPending ? "Creating…" : "New Run"}
          </Button>
        </form>
      </Card>

      {/* Error */}
      {isError && (
        <p className="text-red-400 text-sm mb-4">{(error as Error).message}</p>
      )}

      {/* Skeleton */}
      {isLoading && [1, 2, 3].map((i) => <RunSkeleton key={i} />)}

      {/* Empty */}
      {!isLoading && runs.length === 0 && (
        <p className="text-slate-500">No runs yet. Create one above.</p>
      )}

      {/* Runs list */}
      {!isLoading && runs.length > 0 && (
        <ul className="space-y-2 list-none p-0 m-0">
          {runs.map((run) => (
            <li key={run.run_id}>
              <Card>
                {/* Top row */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex-1 font-medium text-slate-100">{run.goal}</span>
                  <Badge variant={STATE_VARIANT[run.state] ?? "muted"}>
                    {run.state.replace(/_/g, " ")}
                  </Badge>
                  {!["applied", "failed", "rolled_back", "rejected"].includes(run.state) && (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={cancelRun.isPending}
                      onClick={() => cancelRun.mutate(run.run_id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    <span className="text-slate-600">ID </span>
                    <code className="text-[11px]">{run.run_id.slice(0, 8)}</code>
                  </span>
                  <span>
                    <span className="text-slate-600">trigger </span>{run.trigger}
                  </span>
                  <span>
                    <span className="text-slate-600">started </span>{formatDate(run.started_at)}
                  </span>
                  {run.ended_at && (
                    <span>
                      <span className="text-slate-600">ended </span>{formatDate(run.ended_at)}
                    </span>
                  )}
                  {(run.actual_cost || run.estimated_cost) && (
                    <span className="text-violet-400">
                      {run.actual_cost
                        ? `actual ${formatCost(run.actual_cost) ?? ""}`
                        : `est. ${formatCost(run.estimated_cost) ?? ""}`}
                    </span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
