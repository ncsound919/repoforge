import { useAppStore } from "../../store";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const clearToast = useAppStore((s) => s.clearToast);

  if (!toast) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium",
        "animate-in slide-in-from-bottom-4 duration-200",
        toast.type === "error"
          ? "bg-red-950 text-red-300 border border-red-800"
          : "bg-green-950 text-green-300 border border-green-800"
      )}
    >
      <span>{toast.message}</span>
      <button onClick={clearToast} className="btn p-0 bg-transparent text-current opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}
