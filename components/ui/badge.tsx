import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-card text-white",
        destructive: "border-transparent bg-red-500 text-white",
        success: "border-transparent bg-green-500 text-white",
        warning: "border-transparent bg-yellow-500 text-black",
        outline: "border-border text-muted-foreground",
        xp: "border-transparent bg-gradient-to-r from-yellow-500 to-amber-400 text-black",
        rank: "border-transparent bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

