import type { HPCalculation } from "@/types";
import { calculateLevel } from "./xp-calculator";

/**
 * Calculate HP impact from a meal
 */
export function calculateHPImpact(meal: {
  total_protein_g: number;
  total_fiber_g: number;
  total_carbs_g: number;
  has_gujju_sugar: boolean;
  has_hidden_oil: boolean;
  tadka_oil_ml: number;
}): HPCalculation {
  const damages: { reason: string; amount: number }[] = [];
  const recoveries: { reason: string; amount: number }[] = [];

  // Damage from bad choices
  if (meal.has_gujju_sugar) {
    damages.push({ reason: "Insulin Spike (Sugar)", amount: -10 });
  }
  if (meal.has_hidden_oil && meal.tadka_oil_ml > 15) {
    damages.push({ reason: "Hidden Oil Damage", amount: -15 });
  }
  if (meal.tadka_oil_ml > 25) {
    damages.push({ reason: "Oil Overdose", amount: -10 });
  }

  // Recovery from good choices
  if (meal.total_protein_g >= 25) {
    recoveries.push({ reason: "Protein Power", amount: 5 });
  }
  if (meal.total_fiber_g >= 10) {
    recoveries.push({ reason: "Fiber Shield", amount: 5 });
  }
  if (meal.total_protein_g >= 30 && meal.total_fiber_g >= 8) {
    recoveries.push({ reason: "Optimal Meal Bonus", amount: 10 });
  }

  const totalDamage = damages.reduce((sum, d) => sum + d.amount, 0);
  const totalRecovery = recoveries.reduce((sum, r) => sum + r.amount, 0);
  const baseChange = 0;
  const totalChange = baseChange + totalDamage + totalRecovery;

  return {
    baseChange,
    damages,
    recoveries,
    totalChange,
  };
}

/**
 * Get rank based on level
 */
export function getRank(level: number): "Novice" | "Soldier" | "Elite" | "Titan" {
  if (level >= 70) return "Titan";
  if (level >= 30) return "Elite";
  if (level >= 10) return "Soldier";
  return "Novice";
}

/**
 * Get rank color
 */
export function getRankColor(rank: string): string {
  switch (rank) {
    case "Titan":
      return "text-yellow-400";
    case "Elite":
      return "text-purple-400";
    case "Soldier":
      return "text-blue-400";
    default:
      return "text-gray-400";
  }
}

/**
 * Get rank badge gradient
 */
export function getRankGradient(rank: string): string {
  switch (rank) {
    case "Titan":
      return "from-yellow-500 to-amber-600";
    case "Elite":
      return "from-purple-500 to-pink-600";
    case "Soldier":
      return "from-blue-500 to-cyan-600";
    default:
      return "from-gray-500 to-slate-600";
  }
}

/**
 * Calculate optimization score for a meal (0-100)
 */
export function calculateOptimizationScore(
  meal: {
    total_protein_g: number;
    total_fiber_g: number;
    total_calories: number;
    has_gujju_sugar: boolean;
    has_hidden_oil: boolean;
  },
  targets: {
    protein_target_g: number;
    fiber_target_g: number;
    calories_target: number;
  }
): number {
  let score = 50; // Base score

  // Protein ratio (max +25 points)
  const proteinRatio = meal.total_protein_g / (targets.protein_target_g / 3);
  score += Math.min(25, Math.round(proteinRatio * 25));

  // Fiber (max +15 points)
  const fiberRatio = meal.total_fiber_g / (targets.fiber_target_g / 3);
  score += Math.min(15, Math.round(fiberRatio * 15));

  // Calorie efficiency - protein per calorie (max +10 points)
  const proteinPerCal = meal.total_protein_g / meal.total_calories;
  if (proteinPerCal >= 0.05) score += 10;
  else if (proteinPerCal >= 0.03) score += 5;

  // Penalties
  if (meal.has_gujju_sugar) score -= 15;
  if (meal.has_hidden_oil) score -= 10;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate coach tip based on meal analysis
 */
export function generateCoachTip(
  meal: {
    total_protein_g: number;
    total_fiber_g: number;
    total_zinc_mg: number;
    total_magnesium_mg: number;
    has_gujju_sugar: boolean;
    has_hidden_oil: boolean;
    optimization_score: number;
  },
  targets: {
    protein_target_g: number;
    zinc_target_mg: number;
    magnesium_target_mg: number;
  }
): string {
  // Priority-based tip generation
  if (meal.has_gujju_sugar) {
    return "🛑 THE GUJJU TRAP! Sugar in dal spikes insulin. Ask for 'no sugar' next time to save your HP.";
  }

  if (meal.has_hidden_oil) {
    return "🛢️ TADKA TAX! Hidden oil adds empty calories. Request 'less oil' or eat at home for gains.";
  }

  if (meal.total_protein_g < 15) {
    return "⚠️ Low protein detected. Add 100g paneer (+18g protein) or 2 eggs (+12g protein) to hit your muscle-building threshold.";
  }

  if (meal.total_zinc_mg < 2) {
    return "⚡ Zero zinc detected. Add pumpkin seeds (1 tbsp = 2mg zinc) or cashews for testosterone support.";
  }

  if (meal.total_magnesium_mg < 50) {
    return "🧲 Magnesium deficit! Add spinach, banana, or dark chocolate for better sleep and recovery.";
  }

  if (meal.total_fiber_g < 5) {
    return "🥗 Low fiber warning. Add a bowl of vegetables or dal to support gut health.";
  }

  if (meal.optimization_score >= 90) {
    return "💪 ELITE MEAL! Perfect macros. This is Titan-level nutrition. Keep it up!";
  }

  if (meal.optimization_score >= 75) {
    return "🔥 Great meal choice! You're building a stronger body with every bite.";
  }

  if (meal.total_protein_g >= 30) {
    return "💪 Protein powerhouse! Your muscles are thanking you. Keep the gains coming!";
  }

  return "✅ Solid meal logged. Keep the streak alive and level up!";
}

/**
 * Get debuff message for toast notification
 */
export function getDebuffMessage(
  type: "sugar" | "oil" | "trans_fat" | "low_protein"
): { title: string; message: string; emoji: string } {
  switch (type) {
    case "sugar":
      return {
        title: "INSULIN SPIKE",
        message: "Gujju Trap activated (-10 HP)",
        emoji: "⚠️",
      };
    case "oil":
      return {
        title: "TADKA TAX",
        message: "+50 hidden calories from oil",
        emoji: "🛢️",
      };
    case "trans_fat":
      return {
        title: "TRANS FAT TOXIN",
        message: "Fried food detected (-20 HP)",
        emoji: "☠️",
      };
    case "low_protein":
      return {
        title: "MUSCLE ATROPHY",
        message: "Under 15g protein - no gains",
        emoji: "📉",
      };
  }
}

// Re-export calculateLevel for use in store
export { calculateLevel, getRank };

