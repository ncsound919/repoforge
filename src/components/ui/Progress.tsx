import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";

function riskColor(value: number) {
  if (value >= 0.7) return "bg-red-500";
  if (value >= 0.3) return "bg-orange-500";
  return "bg-green-500";
}

interface ProgressProps {
  label: string;
  value: number; // 0–1
  className?: string;
}

export function ScoreProgress({ label, value, className }: ProgressProps) {
  const pct = Math.round(value * 100);
  return (
    <div className={cn("mb-1.5", className)}>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <ProgressPrimitive.Root
        className="h-1 w-full rounded-full bg-slate-700 overflow-hidden"
        value={pct}
      >
        <ProgressPrimitive.Indicator
          className={cn("h-full rounded-full transition-all duration-300", riskColor(value))}
          style={{ width: `${pct}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
