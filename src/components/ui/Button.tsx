import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

const variantMap = {
  primary: "btn-primary",
  success: "btn-success",
  danger:  "btn-danger",
  ghost:   "btn-ghost",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantMap;
  size?: "sm" | "md";
}

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        variantMap[variant],
        size === "sm" && "px-2.5 py-1 text-xs",
        className
      )}
    >
      {children}
    </button>
  );
}
