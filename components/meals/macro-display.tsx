"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MacroDisplayProps {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MacroDisplay({
  calories,
  protein,
  carbs,
  fats,
  size = "md",
  className,
}: MacroDisplayProps) {
  const sizeClasses = {
    sm: {
      container: "gap-2",
      value: "text-sm",
      label: "text-xs",
      padding: "p-1.5",
    },
    md: {
      container: "gap-3",
      value: "text-lg",
      label: "text-xs",
      padding: "p-2",
    },
    lg: {
      container: "gap-4",
      value: "text-2xl",
      label: "text-sm",
      padding: "p-3",
    },
  };

  const styles = sizeClasses[size];

  const macros = [
    { label: "Calories", value: Math.round(calories), unit: "", color: "text-primary" },
    { label: "Protein", value: Math.round(protein), unit: "g", color: "text-green-400" },
    { label: "Carbs", value: Math.round(carbs), unit: "g", color: "text-blue-400" },
    { label: "Fats", value: Math.round(fats), unit: "g", color: "text-yellow-400" },
  ];

  return (
    <div className={cn("grid grid-cols-4", styles.container, className)}>
      {macros.map((macro, index) => (
        <motion.div
          key={macro.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "text-center rounded-lg bg-background/50",
            styles.padding
          )}
        >
          <p className={cn("font-bold", styles.value, macro.color)}>
            {macro.value}
            <span className="font-normal">{macro.unit}</span>
          </p>
          <p className={cn("text-muted-foreground", styles.label)}>
            {macro.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

interface MacroRingProps {
  current: number;
  target: number;
  label: string;
  color: string;
  size?: number;
}

export function MacroRing({
  current,
  target,
  label,
  color,
  size = 80,
}: MacroRingProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-background"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className="text-xs text-white">
        {Math.round(current)}/{target}
      </p>
    </div>
  );
}

