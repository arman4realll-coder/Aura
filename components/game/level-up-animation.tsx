"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { Zap, Trophy, Crown, Sword, Shield } from "lucide-react";
import { useGameStore } from "@/lib/store/game-store";
import { getRank, getRankGradient } from "@/lib/calculations/gamification";
import { cn } from "@/lib/utils";

export function LevelUpAnimation() {
  const { isLevelingUp, currentLevel, rank, clearLevelUp } = useGameStore();

  const previousLevel = currentLevel - 1;
  const previousRank = getRank(previousLevel);
  const hasRankUp = rank !== previousRank;

  // Auto-close after 4 seconds
  useEffect(() => {
    if (isLevelingUp) {
      const timer = setTimeout(() => {
        clearLevelUp();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isLevelingUp, clearLevelUp]);

  const handleClose = useCallback(() => {
    clearLevelUp();
  }, [clearLevelUp]);

  const getRankIcon = (rankName: string) => {
    switch (rankName) {
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

  const RankIcon = getRankIcon(rank);

  return (
    <AnimatePresence>
      {isLevelingUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleClose}
        >
          {/* Confetti */}
          <Confetti
            width={typeof window !== "undefined" ? window.innerWidth : 1000}
            height={typeof window !== "undefined" ? window.innerHeight : 800}
            recycle={false}
            numberOfPieces={200}
            colors={["#f97316", "#fbbf24", "#22c55e", "#3b82f6", "#a855f7"]}
          />

          {/* Background overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-primary/30 via-background/95 to-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />

          {/* Content */}
          <motion.div
            className="relative text-center z-10 px-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 blur-3xl opacity-50">
              <div className="w-full h-full bg-gradient-to-r from-primary via-yellow-500 to-primary rounded-full" />
            </div>

            {/* Level up text */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="w-8 h-8 text-yellow-400" />
                <span className="text-xl font-bold text-yellow-400 tracking-widest">
                  LEVEL UP!
                </span>
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>

              {/* Level number */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 10,
                  delay: 0.5,
                }}
                className="relative mb-6"
              >
                <div className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                  {currentLevel}
                </div>
                <motion.div
                  className="absolute inset-0 text-8xl md:text-9xl font-black text-primary opacity-50 blur-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {currentLevel}
                </motion.div>
              </motion.div>

              {/* Rank badge */}
              {hasRankUp ? (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-2"
                >
                  <p className="text-sm text-muted-foreground">NEW RANK ACHIEVED</p>
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r text-white font-bold text-lg",
                      getRankGradient(rank)
                    )}
                  >
                    <RankIcon className="w-6 h-6" />
                    <span>{rank}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r text-white font-semibold",
                    getRankGradient(rank)
                  )}
                >
                  <RankIcon className="w-5 h-5" />
                  <span>{rank}</span>
                </motion.div>
              )}

              {/* Tap to continue */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-8 text-sm text-muted-foreground"
              >
                Tap anywhere to continue
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

