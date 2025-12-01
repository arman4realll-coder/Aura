"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { useGameStore } from "@/lib/store/game-store";
import {
  calculateLevelProgress,
  xpForNextLevel,
  totalXPForLevel,
} from "@/lib/calculations/xp-calculator";
import { cn } from "@/lib/utils";

interface XPBarProps {
  className?: string;
  showDetails?: boolean;
}

export function XPBar({ className, showDetails = true }: XPBarProps) {
  const { totalXP, currentLevel, xpGainAnimation } = useGameStore();

  const progress = calculateLevelProgress(totalXP);
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpAtLevel = totalXPForLevel(currentLevel);
  const xpIntoLevel = totalXP - xpAtLevel;

  return (
    <div className={cn("relative", className)}>
      {showDetails && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Experience</p>
              <p className="text-sm font-semibold text-white">Level {currentLevel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {xpIntoLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
            </p>
            <p className="text-xs text-yellow-400">{progress}% to next level</p>
          </div>
        </div>
      )}

      <div className="relative h-4 bg-background/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Shimmer effect */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
          />
        </div>
      </div>

      {/* XP Gain Animation */}
      <AnimatePresence>
        {xpGainAnimation && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: -20 }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute -top-2 right-0 flex items-center gap-1 text-yellow-400 font-bold"
          >
            <Zap className="w-4 h-4" />
            <span>+{xpGainAnimation} XP</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

