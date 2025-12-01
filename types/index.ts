// Database Types for Supabase

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;

  // Physical Stats
  height_cm: number;
  current_weight_kg: number;
  starting_weight_kg: number;
  target_weight_kg: number | null;
  age: number;
  body_type: "ectomorph" | "mesomorph" | "endomorph" | null;

  // Diet Preferences
  is_vegetarian: boolean;
  dietary_region: string;

  // Daily Targets
  protein_target_g: number;
  carbs_target_g: number;
  fats_target_g: number;
  calories_target: number;
  magnesium_target_mg: number;
  zinc_target_mg: number;
  fiber_target_g: number;

  // Game Stats
  total_xp: number;
  current_level: number;
  current_hp: number;
  max_hp: number;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
  rank: "Novice" | "Soldier" | "Elite" | "Titan";
}

export interface MealLog {
  id: string;
  user_id: string;
  created_at: string;
  meal_date: string;
  meal_time: string;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";

  items: MealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fats_g: number;
  total_fiber_g: number;
  total_magnesium_mg: number;
  total_zinc_mg: number;

  has_hidden_oil: boolean;
  has_gujju_sugar: boolean;
  tadka_oil_ml: number;

  xp_earned: number;
  hp_impact: number;
  coach_tip: string | null;
  optimization_score: number;
}

export interface MealItem {
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
}

export interface DailySummary {
  id: string;
  user_id: string;
  summary_date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fats_g: number;
  xp_gained_today: number;
  hp_end_of_day: number;
  protein_goal_hit: boolean;
}

export interface FoodItem {
  id: string;
  name_english: string;
  name_gujarati: string | null;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g: number;
  magnesium_per_100g: number;
  zinc_per_100g: number;
  is_high_protein: boolean;
  has_typical_tadka: boolean;
  typical_tadka_oil_ml: number | null;
  bowl_size_g: number | null; // Standard bowl size in grams (e.g., 200g for dal, 150g for sabji)
}

// Form Types
export interface OnboardingData {
  display_name: string;
  height_cm: number;
  current_weight_kg: number;
  age: number;
  body_type: "ectomorph" | "mesomorph" | "endomorph";
  is_vegetarian: boolean;
  dietary_region: string;
  goal: "recomp" | "bulk" | "cut";
}

export interface MealLogInput {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  items: {
    food_id: string;
    quantity_g: number;
  }[];
  has_hidden_oil: boolean;
  has_gujju_sugar: boolean;
  tadka_oil_ml: number;
}

// Game State Types
export interface GameState {
  totalXP: number;
  currentLevel: number;
  currentHP: number;
  maxHP: number;
  currentStreak: number;
  rank: "Novice" | "Soldier" | "Elite" | "Titan";
  isLevelingUp: boolean;
  xpGainAnimation: number | null;
}

export interface DailyProgress {
  calories: { current: number; target: number };
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fats: { current: number; target: number };
  fiber: { current: number; target: number };
  magnesium: { current: number; target: number };
  zinc: { current: number; target: number };
}

// Calculation Result Types
export interface MacroTargets {
  protein_target_g: number;
  carbs_target_g: number;
  fats_target_g: number;
  calories_target: number;
}

export interface XPCalculation {
  baseXP: number;
  bonuses: { reason: string; amount: number }[];
  penalties: { reason: string; amount: number }[];
  totalXP: number;
}

export interface HPCalculation {
  baseChange: number;
  damages: { reason: string; amount: number }[];
  recoveries: { reason: string; amount: number }[];
  totalChange: number;
}

