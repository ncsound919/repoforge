/** API client — talks to the FastAPI worker at localhost:8000 */

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error((detail as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Repo {
  repo_id: string;
  name: string;
  path: string;
  language: string[];
  ingested_at: string | null;
  created_at: string;
}

export interface Run {
  run_id: string;
  repo_id: string;
  graph_id: string;
  state: string;
  trigger: string;
  goal: string;
  estimated_cost: number;
  actual_cost: number;
  executor_type: string;
  started_at: string;
  ended_at: string | null;
}

export interface Approval {
  approval_id: string;
  run_id: string;
  risk_score: number;
  breaking_change_score: number;
  confidence_score: number;
  test_pass_rate: number;
  diff_ref: string;
  decision: "pending" | "approved" | "rejected" | "expired";
  decided_by: string;
  decided_at: string | null;
  expires_at: string;
}

// ---------------------------------------------------------------------------
// Repos
// ---------------------------------------------------------------------------

export const listRepos = () => request<Repo[]>("/repos/");

export const registerRepo = (name: string, path: string) =>
  request<Repo>("/repos/", {
    method: "POST",
    body: JSON.stringify({ name, path }),
  });

export const getRepo = (repoId: string) => request<Repo>(`/repos/${repoId}`);

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

export const listRuns = (repoId?: string) =>
  request<Run[]>(repoId ? `/runs/?repo_id=${repoId}` : "/runs/");

export const createRun = (repoId: string, goal: string, trigger = "manual") =>
  request<Run>("/runs/", {
    method: "POST",
    body: JSON.stringify({ repo_id: repoId, goal, trigger }),
  });

export const getRun = (runId: string) => request<Run>(`/runs/${runId}`);

export const cancelRun = (runId: string) =>
  request<Run>(`/runs/${runId}/cancel`, { method: "PATCH" });

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

export const listApprovals = (runId?: string) =>
  request<Approval[]>(runId ? `/approvals/?run_id=${runId}` : "/approvals/");

export const decideApproval = (
  approvalId: string,
  decision: "approved" | "rejected",
  decidedBy = "human"
) =>
  request<Approval>(`/approvals/${approvalId}`, {
    method: "PATCH",
    body: JSON.stringify({ decision, decided_by: decidedBy }),
  });
