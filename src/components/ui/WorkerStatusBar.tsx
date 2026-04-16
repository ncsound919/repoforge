import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAppStore } from "../../store";
import type { WorkerStatus } from "../../store";
import { cn } from "../../lib/utils";
import { RefreshCw } from "lucide-react";

export function WorkerStatusBar() {
  const { workerStatus, setWorkerStatus } = useAppStore();

  const poll = async () => {
    try {
      const status = await invoke<WorkerStatus>("worker_status");
      setWorkerStatus(status);
    } catch {
      setWorkerStatus({ running: false, pid: null, error: "Tauri bridge unavailable" });
    }
  };

  const restart = async () => {
    try {
      await invoke("worker_restart");
      setTimeout(() => void poll(), 800);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void poll();
    const id = setInterval(() => void poll(), 8_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { running, pid, error } = workerStatus;

  return (
    <div className={cn(
      "flex items-center gap-2 text-xs px-3 py-1 rounded-full border",
      running
        ? "bg-green-950 border-green-800 text-green-400"
        : "bg-red-950 border-red-800 text-red-400"
    )}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        running ? "bg-green-400 animate-pulse" : "bg-red-400"
      )} />
      {running ? (
        <span>worker :{pid ?? "…"}</span>
      ) : (
        <span>{error ?? "worker offline"}</span>
      )}
      <button
        onClick={() => void restart()}
        className="btn p-0 bg-transparent text-current opacity-60 hover:opacity-100 ml-1"
        title="Restart worker"
      >
        <RefreshCw size={11} />
      </button>
    </div>
  );
}
