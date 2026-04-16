/**
 * TanStack Query hooks for all RepoForge server state.
 * Centralises query keys, polling intervals, and cache invalidation.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  listRuns, createRun, cancelRun,
  listRepos, registerRepo,
  listApprovals, decideApproval,
  type Run, type Repo, type Approval,
} from "../api";
import { useAppStore } from "../store";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------
export const QK = {
  runs:      (repoId?: string) => repoId ? ["runs", repoId] : ["runs"],
  repos:     () => ["repos"],
  approvals: (runId?: string)  => runId  ? ["approvals", runId] : ["approvals"],
} as const;

// ---------------------------------------------------------------------------
// Repos
// ---------------------------------------------------------------------------
export function useRepos() {
  return useQuery<Repo[]>({
    queryKey: QK.repos(),
    queryFn: listRepos,
    staleTime: 10_000,
  });
}

export function useRegisterRepo() {
  const qc = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ name, path }: { name: string; path: string }) =>
      registerRepo(name, path),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.repos() });
      showToast("Repository registered successfully");
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------
export function useRuns(repoId?: string) {
  return useQuery<Run[]>({
    queryKey: QK.runs(repoId),
    queryFn: () => listRuns(repoId),
    refetchInterval: 5_000,
  });
}

export function useCreateRun() {
  const qc = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ repoId, goal }: { repoId: string; goal: string }) =>
      createRun(repoId, goal),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.runs() });
      showToast("Run created");
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);
  return useMutation({
    mutationFn: (runId: string) => cancelRun(runId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK.runs() });
      showToast("Run cancelled");
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });
}

// ---------------------------------------------------------------------------
// Approvals — also syncs pending count to Zustand for nav badge
// ---------------------------------------------------------------------------
export function useApprovals(runId?: string) {
  const setPendingCount = useAppStore((s) => s.setPendingApprovalCount);
  const query = useQuery<Approval[]>({
    queryKey: QK.approvals(runId),
    queryFn: () => listApprovals(runId),
    refetchInterval: 5_000,
  });
  useEffect(() => {
    if (query.data) {
      setPendingCount(query.data.filter((a) => a.decision === "pending").length);
    }
  }, [query.data, setPendingCount]);
  return query;
}

export function useDecideApproval() {
  const qc = useQueryClient();
  const showToast = useAppStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      decideApproval(id, decision),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: QK.approvals() });
      showToast(`Approval ${vars.decision}`);
    },
    onError: (e: Error) => showToast(e.message, "error"),
  });
}
