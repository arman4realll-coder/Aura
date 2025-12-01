import type { OnboardingData, MacroTargets } from "@/types";

/**
 * Calculate BMR using Mifflin-St Jeor equation (for males)
 * BMR = (10 × weight in kg) + (6.25 × height in cm) − (5 × age in years) + 5
 */
export function calculateBMR(weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * Using moderate activity multiplier of 1.5
 */
export function calculateTDEE(bmr: number, activityMultiplier: number = 1.5): number {
  return bmr * activityMultiplier;
}

/**
 * Calculate macro targets based on onboarding data
 */
export function calculateMacroTargets(data: OnboardingData): MacroTargets {
  const { current_weight_kg, height_cm, age, goal } = data;

  // Calculate BMR and TDEE
  const bmr = calculateBMR(current_weight_kg, height_cm, age);
  const tdee = calculateTDEE(bmr);

  // Adjust calories based on goal
  let calories = tdee;
  if (goal === "bulk") {
    calories = tdee + 300; // Lean bulk surplus
  } else if (goal === "cut") {
    calories = tdee - 400; // Moderate deficit
  }
  // recomp = maintenance calories

  // Calculate macros - OPTIMIZED FOR SUPERIOR PERFORMANCE
  // Protein: 2.5g per kg bodyweight (elite level for maximum muscle building and recovery)
  const protein_g = Math.round(current_weight_kg * 2.5);

  // Fats: 1.2g per kg bodyweight (optimal for hormone production and cognitive function)
  const fats_g = Math.round(current_weight_kg * 1.2);

  // Carbs: Remaining calories after protein and fat
  // Protein = 4 cal/g, Fat = 9 cal/g, Carbs = 4 cal/g
  const proteinCalories = protein_g * 4;
  const fatCalories = fats_g * 9;
  const remainingCalories = calories - proteinCalories - fatCalories;
  const carbs_g = Math.round(remainingCalories / 4);

  return {
    protein_target_g: protein_g,
    carbs_target_g: Math.max(carbs_g, 100), // Minimum 100g carbs
    fats_target_g: fats_g,
    calories_target: Math.round(calories),
  };
}

/**
 * Calculate micronutrient targets - OPTIMIZED FOR PEAK PERFORMANCE
 * Higher than RDA to ensure optimal recovery, cognitive function, and hormonal health
 */
export function getMicroTargets() {
  return {
    magnesium_target_mg: 600, // 50% above RDA for better sleep, recovery, and muscle function
    zinc_target_mg: 20, // 33% above RDA for optimal testosterone and immune function
    fiber_target_g: 50, // 25% above RDA for optimal gut health and satiety
  };
}

/**
 * Calculate meal totals from individual items
 */
export function calculateMealTotals(
  items: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
    magnesium_mg: number;
    zinc_mg: number;
  }[]
) {
  return items.reduce(
    (totals, item) => ({
      total_calories: totals.total_calories + item.calories,
      total_protein_g: totals.total_protein_g + item.protein_g,
      total_carbs_g: totals.total_carbs_g + item.carbs_g,
      total_fats_g: totals.total_fats_g + item.fats_g,
      total_fiber_g: totals.total_fiber_g + item.fiber_g,
      total_magnesium_mg: totals.total_magnesium_mg + item.magnesium_mg,
      total_zinc_mg: totals.total_zinc_mg + item.zinc_mg,
    }),
    {
      total_calories: 0,
      total_protein_g: 0,
      total_carbs_g: 0,
      total_fats_g: 0,
      total_fiber_g: 0,
      total_magnesium_mg: 0,
      total_zinc_mg: 0,
    }
  );
}

/**
 * Calculate nutrition values for a food item based on quantity
 */
export function calculateFoodNutrition(
  food: {
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fats_per_100g: number;
    fiber_per_100g: number;
    magnesium_per_100g: number;
    zinc_per_100g: number;
  },
  quantity_g: number
) {
  // High precision calculation - using more decimal places for accuracy
  const multiplier = quantity_g / 100;
  return {
    calories: Math.round(food.calories_per_100g * multiplier * 100) / 100,
    protein_g: Math.round(food.protein_per_100g * multiplier * 100) / 100,
    carbs_g: Math.round(food.carbs_per_100g * multiplier * 100) / 100,
    fats_g: Math.round(food.fats_per_100g * multiplier * 100) / 100,
    fiber_g: Math.round(food.fiber_per_100g * multiplier * 100) / 100,
    magnesium_mg: Math.round(food.magnesium_per_100g * multiplier * 100) / 100,
    zinc_mg: Math.round(food.zinc_per_100g * multiplier * 100) / 100,
  };
}

