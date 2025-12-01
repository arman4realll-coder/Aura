"use server";

import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { calculateXP } from "@/lib/calculations/xp-calculator";
import { calculateHPImpact, generateCoachTip, calculateOptimizationScore, calculateLevel, getRank } from "@/lib/calculations/gamification";
import { calculateMealTotals } from "@/lib/calculations/macro-calculator";
import { revalidatePath } from "next/cache";

interface MealLogInput {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  items: {
    food_id: string;
    name: string;
    quantity_g: number;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
    magnesium_mg: number;
    zinc_mg: number;
  }[];
  has_hidden_oil: boolean;
  has_gujju_sugar: boolean;
  tadka_oil_ml: number;
}

export async function logMeal(mealData: MealLogInput) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated" };
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: "Profile not found" };
  }

  // Calculate totals from items
  const totals = calculateMealTotals(mealData.items);

  // Add tadka oil calories if present
  if (mealData.tadka_oil_ml > 0) {
    totals.total_calories += mealData.tadka_oil_ml * 9; // 9 cal per ml of oil
    totals.total_fats_g += mealData.tadka_oil_ml; // ~1g fat per ml
  }

  // Calculate XP earned
  const xpResult = calculateXP(
    {
      total_protein_g: totals.total_protein_g,
      total_fiber_g: totals.total_fiber_g,
      total_magnesium_mg: totals.total_magnesium_mg,
      total_zinc_mg: totals.total_zinc_mg,
      has_gujju_sugar: mealData.has_gujju_sugar,
      has_hidden_oil: mealData.has_hidden_oil,
      tadka_oil_ml: mealData.tadka_oil_ml,
    },
    {
      protein_target_g: profile.protein_target_g,
      magnesium_target_mg: profile.magnesium_target_mg,
      zinc_target_mg: profile.zinc_target_mg,
    }
  );

  // Calculate HP impact
  const hpResult = calculateHPImpact({
    total_protein_g: totals.total_protein_g,
    total_fiber_g: totals.total_fiber_g,
    total_carbs_g: totals.total_carbs_g,
    has_gujju_sugar: mealData.has_gujju_sugar,
    has_hidden_oil: mealData.has_hidden_oil,
    tadka_oil_ml: mealData.tadka_oil_ml,
  });

  // Calculate optimization score
  const optimizationScore = calculateOptimizationScore(
    {
      total_protein_g: totals.total_protein_g,
      total_fiber_g: totals.total_fiber_g,
      total_calories: totals.total_calories,
      has_gujju_sugar: mealData.has_gujju_sugar,
      has_hidden_oil: mealData.has_hidden_oil,
    },
    {
      protein_target_g: profile.protein_target_g,
      fiber_target_g: profile.fiber_target_g,
      calories_target: profile.calories_target,
    }
  );

  // Generate coach tip
  const coachTip = generateCoachTip(
    {
      total_protein_g: totals.total_protein_g,
      total_fiber_g: totals.total_fiber_g,
      total_zinc_mg: totals.total_zinc_mg,
      total_magnesium_mg: totals.total_magnesium_mg,
      has_gujju_sugar: mealData.has_gujju_sugar,
      has_hidden_oil: mealData.has_hidden_oil,
      optimization_score: optimizationScore,
    },
    {
      protein_target_g: profile.protein_target_g,
      zinc_target_mg: profile.zinc_target_mg,
      magnesium_target_mg: profile.magnesium_target_mg,
    }
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const now = format(new Date(), "HH:mm:ss");

  // Insert meal log
  const { data: mealLog, error: mealError } = await supabase
    .from("meal_logs")
    .insert({
      user_id: user.id,
      meal_date: today,
      meal_time: now,
      meal_type: mealData.meal_type,
      items: mealData.items,
      ...totals,
      has_hidden_oil: mealData.has_hidden_oil,
      has_gujju_sugar: mealData.has_gujju_sugar,
      tadka_oil_ml: mealData.tadka_oil_ml,
      xp_earned: xpResult.totalXP,
      hp_impact: hpResult.totalChange,
      coach_tip: coachTip,
      optimization_score: optimizationScore,
    })
    .select()
    .single();

  if (mealError) {
    console.error("Meal log error:", mealError);
    return { error: "Failed to log meal" };
  }

  // Update profile stats (XP, HP, Level, Rank)
  const newTotalXP = profile.total_xp + xpResult.totalXP;
  const newLevel = calculateLevel(newTotalXP);
  const newRank = getRank(newLevel);
  const newHP = Math.max(0, Math.min(profile.max_hp, profile.current_hp + hpResult.totalChange));

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      total_xp: newTotalXP,
      current_level: newLevel,
      current_hp: newHP,
      rank: newRank,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    console.error("Profile update error:", profileUpdateError);
  }

  // Upsert daily summary
  const { data: existingSummary } = await supabase
    .from("daily_summaries")
    .select("*")
    .eq("user_id", user.id)
    .eq("summary_date", today)
    .single();

  if (existingSummary) {
    await supabase
      .from("daily_summaries")
      .update({
        total_calories: existingSummary.total_calories + totals.total_calories,
        total_protein_g: existingSummary.total_protein_g + totals.total_protein_g,
        total_carbs_g: existingSummary.total_carbs_g + totals.total_carbs_g,
        total_fats_g: existingSummary.total_fats_g + totals.total_fats_g,
        xp_gained_today: existingSummary.xp_gained_today + xpResult.totalXP,
        hp_end_of_day: newHP,
        protein_goal_hit:
          existingSummary.total_protein_g + totals.total_protein_g >=
          profile.protein_target_g,
      })
      .eq("id", existingSummary.id);
  } else {
    await supabase.from("daily_summaries").insert({
      user_id: user.id,
      summary_date: today,
      total_calories: totals.total_calories,
      total_protein_g: totals.total_protein_g,
      total_carbs_g: totals.total_carbs_g,
      total_fats_g: totals.total_fats_g,
      xp_gained_today: xpResult.totalXP,
      hp_end_of_day: newHP,
      protein_goal_hit: totals.total_protein_g >= profile.protein_target_g,
    });
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    mealLog,
    xpEarned: xpResult.totalXP,
    hpChange: hpResult.totalChange,
    coachTip,
    newLevel,
    leveledUp: newLevel > profile.current_level,
    xpBreakdown: xpResult,
    hpBreakdown: hpResult,
  };
}

