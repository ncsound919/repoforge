/**
 * Zustand v5 global store — UI state, worker status, and tab selection.
 * Server data (runs, repos, approvals) is managed by TanStack Query.
 * This store handles derived/local state that doesn't belong in a query cache.
 */
import { create } from "zustand";

export type Tab = "runs" | "repos" | "approvals";

export interface WorkerStatus {
  running: boolean;
  pid: number | null;
  error: string | null;
}

interface AppStore {
  // Navigation
  tab: Tab;
  setTab: (tab: Tab) => void;

  // Pending approval count — drives the nav badge
  pendingApprovalCount: number;
  setPendingApprovalCount: (n: number) => void;

  // FastAPI worker sidecar status
  workerStatus: WorkerStatus;
  setWorkerStatus: (s: WorkerStatus) => void;

  // Global notification
  toast: { message: string; type: "success" | "error" } | null;
  showToast: (message: string, type?: "success" | "error") => void;
  clearToast: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  tab: "runs",
  setTab: (tab) => set({ tab }),

  pendingApprovalCount: 0,
  setPendingApprovalCount: (n) => set({ pendingApprovalCount: n }),

  workerStatus: { running: false, pid: null, error: null },
  setWorkerStatus: (s) => set({ workerStatus: s }),

  toast: null,
  showToast: (message, type = "success") => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3500);
  },
  clearToast: () => set({ toast: null }),
}));
