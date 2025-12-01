import type { MealLog, Profile, XPCalculation } from "@/types";

/**
 * Calculate XP earned from a meal
 */
export function calculateXP(
  meal: {
    total_protein_g: number;
    total_fiber_g: number;
    total_magnesium_mg: number;
    total_zinc_mg: number;
    has_gujju_sugar: boolean;
    has_hidden_oil: boolean;
    tadka_oil_ml: number;
  },
  userTargets: {
    protein_target_g: number;
    magnesium_target_mg: number;
    zinc_target_mg: number;
  }
): XPCalculation {
  const bonuses: { reason: string; amount: number }[] = [];
  const penalties: { reason: string; amount: number }[] = [];

  // Base XP: +10 per 10g protein
  const baseXP = Math.floor(meal.total_protein_g / 10) * 10;

  // Protein bonus: Extra XP for high protein meals
  if (meal.total_protein_g >= 30) {
    bonuses.push({ reason: "High Protein Meal (30g+)", amount: 25 });
  } else if (meal.total_protein_g >= 25) {
    bonuses.push({ reason: "Good Protein Meal (25g+)", amount: 15 });
  }

  // Fiber bonus
  if (meal.total_fiber_g >= 10) {
    bonuses.push({ reason: "Fiber Champion (10g+)", amount: 20 });
  }

  // Micronutrient bonuses (hitting 1/3 of daily target)
  if (meal.total_magnesium_mg >= userTargets.magnesium_target_mg / 3) {
    bonuses.push({ reason: "Magnesium Boost", amount: 50 });
  }
  if (meal.total_zinc_mg >= userTargets.zinc_target_mg / 3) {
    bonuses.push({ reason: "Zinc Power", amount: 50 });
  }

  // Penalties for bad choices
  if (meal.has_gujju_sugar) {
    penalties.push({ reason: "Gujju Trap (Sugar in dal)", amount: -20 });
  }
  if (meal.has_hidden_oil && meal.tadka_oil_ml > 10) {
    penalties.push({ reason: "Hidden Oil Tax", amount: -30 });
  }
  if (meal.tadka_oil_ml > 20) {
    penalties.push({ reason: "Excessive Tadka", amount: -15 });
  }

  const totalBonuses = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const totalPenalties = penalties.reduce((sum, p) => sum + p.amount, 0);
  const totalXP = Math.max(0, baseXP + totalBonuses + totalPenalties);

  return {
    baseXP,
    bonuses,
    penalties,
    totalXP,
  };
}

/**
 * Calculate XP required to reach the next level
 * Uses exponential growth: 100 * level^1.5
 */
export function xpForNextLevel(currentLevel: number): number {
  return Math.floor(100 * Math.pow(currentLevel, 1.5));
}

/**
 * Calculate total XP required to reach a specific level
 */
export function totalXPForLevel(level: number): number {
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += xpForNextLevel(i);
  }
  return totalXP;
}

/**
 * Calculate current level from total XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  let xpRequired = 0;

  while (xpRequired <= totalXP) {
    level++;
    xpRequired += xpForNextLevel(level - 1);
  }

  return level - 1;
}

/**
 * Calculate progress towards next level (0-100%)
 */
export function calculateLevelProgress(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const xpAtCurrentLevel = totalXPForLevel(currentLevel);
  const xpForNext = xpForNextLevel(currentLevel);
  const xpIntoLevel = totalXP - xpAtCurrentLevel;

  return Math.round((xpIntoLevel / xpForNext) * 100);
}

/**
 * Calculate daily XP bonus for streak
 */
export function getStreakBonus(streakDays: number): number {
  if (streakDays >= 30) return 100;
  if (streakDays >= 14) return 50;
  if (streakDays >= 7) return 25;
  if (streakDays >= 3) return 10;
  return 0;
}

