"use client";

import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import { useGameStore } from "@/lib/store/game-store";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  className?: string;
  variant?: "default" | "compact";
}

export function StreakCounter({
  className,
  variant = "default",
}: StreakCounterProps) {
  const { currentStreak, profile } = useGameStore();
  const longestStreak = profile?.longest_streak || currentStreak;

  const isHotStreak = currentStreak >= 7;
  const isOnFire = currentStreak >= 14;
  const isLegendary = currentStreak >= 30;

  const getStreakStatus = () => {
    if (isLegendary) return { text: "LEGENDARY", color: "text-purple-400" };
    if (isOnFire) return { text: "ON FIRE", color: "text-primary" };
    if (isHotStreak) return { text: "HOT STREAK", color: "text-yellow-400" };
    if (currentStreak >= 3) return { text: "Building", color: "text-green-400" };
    return { text: "Start streak", color: "text-muted-foreground" };
  };

  const status = getStreakStatus();

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <motion.div
          animate={
            isHotStreak
              ? {
                  scale: [1, 1.1, 1],
                  rotate: [0, -5, 5, 0],
                }
              : {}
          }
          transition={{ duration: 0.5, repeat: isHotStreak ? Infinity : 0, repeatDelay: 1 }}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isLegendary
              ? "bg-gradient-to-br from-purple-500 to-pink-500"
              : isOnFire
              ? "bg-gradient-to-br from-primary to-red-500"
              : "bg-gradient-to-br from-primary-600 to-primary"
          )}
        >
          <Flame className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <p className="text-lg font-bold text-white">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">day streak</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card p-4 relative overflow-hidden",
        className
      )}
    >
      {/* Background glow for hot streaks */}
      {isHotStreak && (
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: isLegendary
              ? "radial-gradient(circle at center, purple, transparent 70%)"
              : "radial-gradient(circle at center, #f97316, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={
              isHotStreak
                ? {
                    scale: [1, 1.15, 1],
                  }
                : {}
            }
            transition={{
              duration: 0.8,
              repeat: isHotStreak ? Infinity : 0,
              repeatDelay: 0.5,
            }}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center relative",
              isLegendary
                ? "bg-gradient-to-br from-purple-500 to-pink-500"
                : isOnFire
                ? "bg-gradient-to-br from-primary to-red-500"
                : "bg-gradient-to-br from-primary-600 to-primary"
            )}
          >
            <Flame className="w-7 h-7 text-white" />

            {/* Fire particles for hot streaks */}
            {isOnFire && (
              <>
                <motion.div
                  className="absolute -top-1 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{
                    y: [-5, -15],
                    opacity: [1, 0],
                    scale: [1, 0.5],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.3 }}
                />
                <motion.div
                  className="absolute -top-1 left-1/3 w-1.5 h-1.5 bg-orange-400 rounded-full"
                  animate={{
                    y: [-3, -12],
                    opacity: [1, 0],
                    scale: [1, 0.3],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 0.5,
                    delay: 0.2,
                  }}
                />
              </>
            )}
          </motion.div>

          <div>
            <motion.p
              className="text-3xl font-bold text-white"
              key={currentStreak}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              {currentStreak}
            </motion.p>
            <p className="text-xs text-muted-foreground">
              day{currentStreak !== 1 ? "s" : ""} streak
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className={cn("text-sm font-semibold", status.color)}>
            {status.text}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Trophy className="w-3 h-3" />
            <span>Best: {longestStreak}</span>
          </div>
        </div>
      </div>

      {/* Streak milestones */}
      <div className="mt-4 flex gap-2">
        {[3, 7, 14, 30].map((milestone) => (
          <div
            key={milestone}
            className={cn(
              "flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-all",
              currentStreak >= milestone
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-background/50 text-muted-foreground"
            )}
          >
            {milestone}d
          </div>
        ))}
      </div>
    </div>
  );
}

