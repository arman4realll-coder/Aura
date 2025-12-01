"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coffee,
  Sun,
  Moon,
  Cookie,
  X,
  Zap,
  Heart,
  AlertTriangle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { logMeal } from "@/lib/actions/log-meal";
import { useGameStore } from "@/lib/store/game-store";
import { FoodSearch } from "@/components/meals/food-search";
import { MacroDisplay } from "@/components/meals/macro-display";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateFoodNutrition } from "@/lib/calculations/macro-calculator";
import { calculateXP } from "@/lib/calculations/xp-calculator";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/types";

const MEAL_TYPES = [
  {
    value: "breakfast" as const,
    label: "Breakfast",
    icon: Coffee,
    color: "text-yellow-400",
    bg: "bg-yellow-400/20",
    border: "border-yellow-400/50",
  },
  {
    value: "lunch" as const,
    label: "Lunch",
    icon: Sun,
    color: "text-orange-400",
    bg: "bg-orange-400/20",
    border: "border-orange-400/50",
  },
  {
    value: "dinner" as const,
    label: "Dinner",
    icon: Moon,
    color: "text-blue-400",
    bg: "bg-blue-400/20",
    border: "border-blue-400/50",
  },
  {
    value: "snack" as const,
    label: "Snack",
    icon: Cookie,
    color: "text-purple-400",
    bg: "bg-purple-400/20",
    border: "border-purple-400/50",
  },
];

interface SelectedFoodItem {
  food: FoodItem;
  quantity_g: number;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
    magnesium_mg: number;
    zinc_mg: number;
  };
}

export default function LogMealPage() {
  const router = useRouter();
  const { profile, addXP, updateHP, triggerLevelUp } = useGameStore();
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const [selectedItems, setSelectedItems] = useState<SelectedFoodItem[]>([]);
  const [hasHiddenOil, setHasHiddenOil] = useState(false);
  const [hasGujjuSugar, setHasGujjuSugar] = useState(false);
  const [tadkaOil, setTadkaOil] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOilInput, setShowOilInput] = useState(false);

  const handleAddFood = (food: FoodItem, quantity: number) => {
    const nutrition = calculateFoodNutrition(
      {
        calories_per_100g: food.calories_per_100g,
        protein_per_100g: food.protein_per_100g,
        carbs_per_100g: food.carbs_per_100g,
        fats_per_100g: food.fats_per_100g,
        fiber_per_100g: food.fiber_per_100g,
        magnesium_per_100g: food.magnesium_per_100g,
        zinc_per_100g: food.zinc_per_100g,
      },
      quantity
    );

    setSelectedItems((prev) => [
      ...prev,
      {
        food,
        quantity_g: quantity,
        nutrition,
      },
    ]);

    // Auto-detect tadka if food has it
    if (food.has_typical_tadka && food.typical_tadka_oil_ml) {
      setHasHiddenOil(true);
      setTadkaOil((prev) => prev + (food.typical_tadka_oil_ml || 0));
      setShowOilInput(true);
    }
  };

  const handleRemoveFood = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const totals = selectedItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.nutrition.calories,
      protein: acc.protein + item.nutrition.protein_g,
      carbs: acc.carbs + item.nutrition.carbs_g,
      fats: acc.fats + item.nutrition.fats_g,
      fiber: acc.fiber + item.nutrition.fiber_g,
      magnesium: acc.magnesium + item.nutrition.magnesium_mg,
      zinc: acc.zinc + item.nutrition.zinc_mg,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, magnesium: 0, zinc: 0 }
  );

  // Add tadka oil to totals
  const finalTotals = {
    ...totals,
    calories: totals.calories + tadkaOil * 9,
    fats: totals.fats + tadkaOil,
  };

  // Calculate preview XP
  const previewXP = profile
    ? calculateXP(
        {
          total_protein_g: totals.protein,
          total_fiber_g: totals.fiber,
          total_magnesium_mg: totals.magnesium,
          total_zinc_mg: totals.zinc,
          has_gujju_sugar: hasGujjuSugar,
          has_hidden_oil: hasHiddenOil,
          tadka_oil_ml: tadkaOil,
        },
        {
          protein_target_g: profile.protein_target_g,
          magnesium_target_mg: profile.magnesium_target_mg,
          zinc_target_mg: profile.zinc_target_mg,
        }
      )
    : null;

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Add at least one food item");
      return;
    }

    setIsSubmitting(true);

    const mealData = {
      meal_type: mealType,
      items: selectedItems.map((item) => ({
        food_id: item.food.id,
        name: item.food.name_english,
        quantity_g: item.quantity_g,
        calories: item.nutrition.calories,
        protein_g: item.nutrition.protein_g,
        carbs_g: item.nutrition.carbs_g,
        fats_g: item.nutrition.fats_g,
        fiber_g: item.nutrition.fiber_g,
        magnesium_mg: item.nutrition.magnesium_mg,
        zinc_mg: item.nutrition.zinc_mg,
      })),
      has_hidden_oil: hasHiddenOil,
      has_gujju_sugar: hasGujjuSugar,
      tadka_oil_ml: tadkaOil,
    };

    const result = await logMeal(mealData);

    if (result.error) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    // Update local state
    if (result.xpEarned && result.xpEarned > 0) {
      addXP(result.xpEarned);
    }
    if (result.hpChange) {
      updateHP(result.hpChange);
    }
    if (result.leveledUp) {
      triggerLevelUp();
    }

    // Show debuff toasts
    if (hasGujjuSugar) {
      toast.error("⚠️ INSULIN SPIKE: Gujju Trap activated (-10 HP)", {
        duration: 4000,
      });
    }
    if (hasHiddenOil && tadkaOil > 10) {
      toast.warning(`🛢️ TADKA TAX: +${tadkaOil * 9} hidden calories from oil`, {
        duration: 4000,
      });
    }

    // Success toast
    toast.success(
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-yellow-400">
          <Zap className="w-4 h-4" />
          +{result.xpEarned} XP
        </div>
        {result.hpChange !== undefined && result.hpChange !== 0 && (
          <div
            className={cn(
              "flex items-center gap-1",
              result.hpChange > 0 ? "text-green-400" : "text-red-400"
            )}
          >
            <Heart className="w-4 h-4" />
            {result.hpChange > 0 ? "+" : ""}
            {result.hpChange} HP
          </div>
        )}
      </div>
    );

    // Navigate back to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Log Meal</h1>
        <p className="text-muted-foreground">
          Track what you eat and earn XP
        </p>
      </motion.div>

      {/* Meal Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label className="mb-3 block">Meal Type</Label>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => {
            const isSelected = mealType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setMealType(type.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                  isSelected
                    ? `${type.bg} ${type.border} ${type.color}`
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <type.icon
                  className={cn("w-6 h-6", isSelected ? type.color : "text-muted-foreground")}
                />
                <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-muted-foreground")}>
                  {type.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Food Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Add Foods</CardTitle>
          </CardHeader>
          <CardContent>
            <FoodSearch onSelect={handleAddFood} region={profile?.dietary_region} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Selected Items */}
      <AnimatePresence mode="popLayout">
        {selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Selected Foods ({selectedItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedItems.map((item, index) => (
                  <motion.div
                    key={`${item.food.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {item.food.name_english}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity_g}g • {Math.round(item.nutrition.calories)} cal •{" "}
                        {item.nutrition.protein_g}g protein
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFood(index)}
                      className="p-1 rounded-lg hover:bg-card transition-colors"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debuff Flags */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Debuff Detection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Checkbox
              id="hiddenOil"
              checked={hasHiddenOil}
              onChange={(e) => {
                setHasHiddenOil((e.target as HTMLInputElement).checked);
                setShowOilInput((e.target as HTMLInputElement).checked);
              }}
              label="Contains hidden oil/tadka (dal, sabji, etc.)"
            />

            <AnimatePresence>
              {showOilInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 pl-8"
                >
                  <Label htmlFor="tadkaOil">Estimated oil (ml):</Label>
                  <Input
                    id="tadkaOil"
                    type="number"
                    value={tadkaOil}
                    onChange={(e) => setTadkaOil(Number(e.target.value))}
                    className="w-24"
                    min={0}
                    max={100}
                  />
                  <span className="text-xs text-muted-foreground">
                    (+{tadkaOil * 9} hidden calories)
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <Checkbox
              id="gujjuSugar"
              checked={hasGujjuSugar}
              onChange={(e) => setHasGujjuSugar((e.target as HTMLInputElement).checked)}
              label="Gujarati style (sugar in dal/kadhi)"
            />

            {(hasHiddenOil || hasGujjuSugar) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm"
              >
                <p className="text-red-400 font-medium">⚠️ Debuffs detected:</p>
                <ul className="text-muted-foreground mt-1 space-y-1">
                  {hasGujjuSugar && <li>• Gujju Trap: -20 XP, -10 HP</li>}
                  {hasHiddenOil && tadkaOil > 10 && (
                    <li>• Hidden Oil: -30 XP</li>
                  )}
                </ul>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Totals & XP Preview */}
      {selectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>Meal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MacroDisplay
                calories={finalTotals.calories}
                protein={finalTotals.protein}
                carbs={finalTotals.carbs}
                fats={finalTotals.fats}
              />

              {/* XP Preview */}
              {previewXP && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">XP to earn:</span>
                    <span className="flex items-center gap-1 text-xl font-bold text-yellow-400">
                      <Zap className="w-5 h-5" />+{previewXP.totalXP}
                    </span>
                  </div>

                  <button
                    onClick={() => {}}
                    className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-white transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    View breakdown
                  </button>

                  {previewXP.bonuses.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {previewXP.bonuses.map((bonus, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-green-400">+ {bonus.reason}</span>
                          <span className="text-green-400">+{bonus.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {previewXP.penalties.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {previewXP.penalties.map((penalty, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-red-400">- {penalty.reason}</span>
                          <span className="text-red-400">{penalty.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="sticky bottom-20 lg:bottom-4"
      >
        <Button
          onClick={handleSubmit}
          disabled={selectedItems.length === 0 || isSubmitting}
          className="w-full h-14 text-lg"
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              Log Meal
              {previewXP && previewXP.totalXP > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/30 text-yellow-400 text-sm">
                  +{previewXP.totalXP} XP
                </span>
              )}
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

