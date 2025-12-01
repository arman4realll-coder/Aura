"use client";

import { motion } from "framer-motion";
import { Heart, HeartCrack, Shield } from "lucide-react";
import { useGameStore } from "@/lib/store/game-store";
import { cn } from "@/lib/utils";

interface HPBarProps {
  className?: string;
  showDetails?: boolean;
}

export function HPBar({ className, showDetails = true }: HPBarProps) {
  const { currentHP, maxHP } = useGameStore();

  const percentage = (currentHP / maxHP) * 100;

  const getHPColor = () => {
    if (percentage > 70) return "from-green-500 to-emerald-400";
    if (percentage > 30) return "from-yellow-500 to-amber-400";
    return "from-red-500 to-rose-400";
  };

  const getHPStatus = () => {
    if (percentage > 70) return { icon: Shield, text: "Healthy", color: "text-green-400" };
    if (percentage > 30) return { icon: Heart, text: "Caution", color: "text-yellow-400" };
    return { icon: HeartCrack, text: "Critical", color: "text-red-400" };
  };

  const status = getHPStatus();
  const StatusIcon = status.icon;

  return (
    <div className={cn("relative", className)}>
      {showDetails && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                percentage > 70
                  ? "bg-gradient-to-br from-green-500 to-emerald-600"
                  : percentage > 30
                  ? "bg-gradient-to-br from-yellow-500 to-amber-600"
                  : "bg-gradient-to-br from-red-500 to-rose-600"
              )}
            >
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Health Points</p>
              <p className={cn("text-sm font-semibold", status.color)}>
                {status.text}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-white">
              {currentHP}/{maxHP}
            </p>
            <p className="text-xs text-muted-foreground">HP</p>
          </div>
        </div>
      )}

      <div className="relative h-4 bg-background/50 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getHPColor())}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Pulse effect when low HP */}
        {percentage <= 30 && (
          <motion.div
            className="absolute inset-0 bg-red-500/30 rounded-full"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* HP segments for visual reference */}
      <div className="absolute top-0 left-0 right-0 h-4 flex pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="flex-1 border-r border-background/30 last:border-r-0"
          />
        ))}
      </div>
    </div>
  );
}

