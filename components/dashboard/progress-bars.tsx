"use client";

import { motion } from "framer-motion";
import { Check, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MacroProgressProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color: string;
  showXPBadge?: boolean;
}

export function MacroProgress({
  label,
  current,
  target,
  unit = "g",
  color,
  showXPBadge = false,
}: MacroProgressProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isComplete = current >= target;
  const isOverTarget = current > target * 1.2;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{label}</span>
          {isComplete && !isOverTarget && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
          {isOverTarget && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center"
            >
              <AlertTriangle className="w-3 h-3 text-black" />
            </motion.div>
          )}
          {showXPBadge && isComplete && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 font-medium"
            >
              +XP
            </motion.span>
          )}
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round(current)}
          {unit} / {target}
          {unit}
        </span>
      </div>

      <div className="h-3 bg-background/50 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{Math.round(percentage)}%</span>
        <span>{Math.round(target - current)} {unit} remaining</span>
      </div>
    </div>
  );
}

interface DailyProgressProps {
  progress: {
    calories: { current: number; target: number };
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fats: { current: number; target: number };
  };
}

export function DailyProgress({ progress }: DailyProgressProps) {
  return (
    <div className="space-y-6">
      <MacroProgress
        label="Calories"
        current={progress.calories.current}
        target={progress.calories.target}
        unit=" kcal"
        color="bg-gradient-to-r from-primary to-orange-400"
      />
      <MacroProgress
        label="Protein"
        current={progress.protein.current}
        target={progress.protein.target}
        color="bg-gradient-to-r from-green-500 to-emerald-400"
        showXPBadge
      />
      <MacroProgress
        label="Carbs"
        current={progress.carbs.current}
        target={progress.carbs.target}
        color="bg-gradient-to-r from-blue-500 to-cyan-400"
      />
      <MacroProgress
        label="Fats"
        current={progress.fats.current}
        target={progress.fats.target}
        color="bg-gradient-to-r from-yellow-500 to-amber-400"
      />
    </div>
  );
}

