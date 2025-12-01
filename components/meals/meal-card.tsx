"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Coffee,
  Sun,
  Moon,
  Cookie,
  Zap,
  Heart,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealLog } from "@/types";

interface MealCardProps {
  meal: MealLog;
  onEdit?: (meal: MealLog) => void;
  onDelete?: (meal: MealLog) => void;
  className?: string;
}

const MEAL_ICONS = {
  breakfast: { icon: Coffee, color: "text-yellow-400", bg: "bg-yellow-400/20" },
  lunch: { icon: Sun, color: "text-orange-400", bg: "bg-orange-400/20" },
  dinner: { icon: Moon, color: "text-blue-400", bg: "bg-blue-400/20" },
  snack: { icon: Cookie, color: "text-purple-400", bg: "bg-purple-400/20" },
};

export function MealCard({ meal, onEdit, onDelete, className }: MealCardProps) {
  const mealConfig = MEAL_ICONS[meal.meal_type];
  const MealIcon = mealConfig.icon;

  const formatMealTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return format(date, "h:mm a");
    } catch {
      return time;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card p-4 hover:border-primary/30 transition-colors",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              mealConfig.bg
            )}
          >
            <MealIcon className={cn("w-5 h-5", mealConfig.color)} />
          </div>
          <div>
            <h3 className="font-semibold text-white capitalize">
              {meal.meal_type}
            </h3>
            <p className="text-xs text-muted-foreground">
              {formatMealTime(meal.meal_time)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {meal.xp_earned > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
              <Zap className="w-3 h-3" />
              +{meal.xp_earned}
            </div>
          )}
          {meal.hp_impact !== 0 && (
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                meal.hp_impact > 0
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              )}
            >
              <Heart className="w-3 h-3" />
              {meal.hp_impact > 0 ? "+" : ""}
              {meal.hp_impact}
            </div>
          )}
          <div className="relative group">
            <button className="p-1 rounded-lg hover:bg-background transition-colors">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="absolute right-0 top-full mt-1 py-1 bg-card rounded-lg border border-border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
              {onEdit && (
                <button
                  onClick={() => onEdit(meal)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-background transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(meal)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-background transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Food Items */}
      <div className="mb-3">
        <p className="text-sm text-white">
          {meal.items.map((item) => item.name).join(", ")}
        </p>
      </div>

      {/* Macros */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg bg-background/50">
          <p className="text-sm font-bold text-primary">
            {Math.round(meal.total_calories)}
          </p>
          <p className="text-xs text-muted-foreground">cal</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/50">
          <p className="text-sm font-bold text-green-400">
            {Math.round(meal.total_protein_g)}g
          </p>
          <p className="text-xs text-muted-foreground">protein</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/50">
          <p className="text-sm font-bold text-blue-400">
            {Math.round(meal.total_carbs_g)}g
          </p>
          <p className="text-xs text-muted-foreground">carbs</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-background/50">
          <p className="text-sm font-bold text-yellow-400">
            {Math.round(meal.total_fats_g)}g
          </p>
          <p className="text-xs text-muted-foreground">fats</p>
        </div>
      </div>

      {/* Warnings */}
      {(meal.has_gujju_sugar || meal.has_hidden_oil) && (
        <div className="flex gap-2 mb-3">
          {meal.has_gujju_sugar && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
              ⚠️ Sugar detected
            </span>
          )}
          {meal.has_hidden_oil && (
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
              🛢️ Hidden oil ({meal.tadka_oil_ml}ml)
            </span>
          )}
        </div>
      )}

      {/* Coach Tip */}
      {meal.coach_tip && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-white">{meal.coach_tip}</p>
        </div>
      )}
    </motion.div>
  );
}

