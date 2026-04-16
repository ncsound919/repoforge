import { cn } from "../../lib/utils";

const variantMap: Record<string, string> = {
  default:   "bg-slate-700 text-slate-300",
  primary:   "bg-sky-900/50 text-sky-400 border border-sky-700",
  success:   "bg-green-900/50 text-green-400 border border-green-700",
  warning:   "bg-amber-900/50 text-amber-400 border border-amber-700",
  danger:    "bg-red-900/50 text-red-400 border border-red-700",
  orange:    "bg-orange-900/50 text-orange-400 border border-orange-700",
  purple:    "bg-purple-900/50 text-purple-400 border border-purple-700",
  muted:     "bg-slate-800 text-slate-500 border border-slate-700",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof variantMap;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={cn("badge", variantMap[variant], className)}>
      {children}
    </span>
  );
}
