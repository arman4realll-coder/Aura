"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "xp" | "hp";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = "default",
      showLabel = false,
      size = "md",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-2",
      md: "h-3",
      lg: "h-4",
    };

    const variantClasses = {
      default: "bg-primary",
      success: "bg-green-500",
      warning: "bg-yellow-500",
      danger: "bg-red-500",
      xp: "bg-gradient-to-r from-yellow-500 to-amber-400",
      hp: percentage > 70
        ? "bg-gradient-to-r from-green-500 to-emerald-400"
        : percentage > 30
        ? "bg-gradient-to-r from-yellow-500 to-amber-400"
        : "bg-gradient-to-r from-red-500 to-rose-400",
    };

    return (
      <div className="w-full">
        <div
          ref={ref}
          className={cn(
            "w-full overflow-hidden rounded-full bg-background/50",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{Math.round(value)}</span>
            <span>{max}</span>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };

