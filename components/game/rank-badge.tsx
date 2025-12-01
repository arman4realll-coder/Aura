"use client";

import { motion } from "framer-motion";
import { Crown, Trophy, Sword, Shield } from "lucide-react";
import { getRankGradient, getRankColor } from "@/lib/calculations/gamification";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: "Novice" | "Soldier" | "Elite" | "Titan";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function RankBadge({
  rank,
  size = "md",
  showLabel = true,
  animated = true,
  className,
}: RankBadgeProps) {
  const getRankIcon = () => {
    switch (rank) {
      case "Titan":
        return Crown;
      case "Elite":
        return Trophy;
      case "Soldier":
        return Sword;
      default:
        return Shield;
    }
  };

  const Icon = getRankIcon();

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        className={cn(
          "rounded-xl flex items-center justify-center bg-gradient-to-br",
          sizeClasses[size],
          getRankGradient(rank)
        )}
        animate={
          animated && rank === "Titan"
            ? { scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }
            : {}
        }
        transition={{
          duration: 2,
          repeat: animated && rank === "Titan" ? Infinity : 0,
        }}
      >
        <Icon className={cn("text-white", iconSizes[size])} />
      </motion.div>
      {showLabel && (
        <div>
          <p className={cn("font-bold", textSizes[size], getRankColor(rank))}>
            {rank}
          </p>
        </div>
      )}
    </div>
  );
}

