"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Star, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FoodItem } from "@/types";

interface FoodSearchProps {
  onSelect: (food: FoodItem, quantity: number) => void;
  region?: string;
  className?: string;
}

type MeasurementUnit = "grams" | "bowl";

export function FoodSearch({ onSelect, region, className }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState<MeasurementUnit>("grams");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchFoods = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      const supabase = createClient();

      // Enhanced search: search both English and Gujarati names, prioritize by relevance
      const searchTerm = query.toLowerCase().trim();
      
      // Build query with fuzzy matching
      let queryBuilder = supabase
        .from("food_database")
        .select("*")
        .or(`name_english.ilike.%${searchTerm}%,name_gujarati.ilike.%${searchTerm}%`);

      // Prioritize regional foods if region is specified
      if (region) {
        // This will be handled in sorting
      }

      const { data } = await queryBuilder.limit(20);

      if (data) {
        // Advanced sorting algorithm
        const sortedResults = (data as FoodItem[]).sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          // Exact match gets highest priority
          if (a.name_english.toLowerCase() === searchTerm) scoreA += 1000;
          if (b.name_english.toLowerCase() === searchTerm) scoreB += 1000;

          // Starts with query gets high priority
          if (a.name_english.toLowerCase().startsWith(searchTerm)) scoreA += 500;
          if (b.name_english.toLowerCase().startsWith(searchTerm)) scoreB += 500;

          // High protein foods get bonus
          if (a.is_high_protein) scoreA += 100;
          if (b.is_high_protein) scoreB += 100;

          // Regional preference (if Gujarati region and food has Gujarati name)
          if (region === "Gujarat" && a.name_gujarati) scoreA += 50;
          if (region === "Gujarat" && b.name_gujarati) scoreB += 50;

          // Protein content matters
          scoreA += a.protein_per_100g * 2;
          scoreB += b.protein_per_100g * 2;

          return scoreB - scoreA;
        });

        setResults(sortedResults.slice(0, 10));
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchFoods, 200);
    return () => clearTimeout(debounce);
  }, [query, region]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuery("");
    setResults([]);
    // Auto-set to bowl if available, otherwise default to 100g
    if (food.bowl_size_g) {
      setUnit("bowl");
      setQuantity(food.bowl_size_g);
    } else {
      setUnit("grams");
      setQuantity(100);
    }
  };

  const handleAddFood = () => {
    if (selectedFood && quantity > 0) {
      // Convert bowl to grams if needed
      const quantityInGrams = unit === "bowl" && selectedFood.bowl_size_g 
        ? quantity * selectedFood.bowl_size_g 
        : quantity;
      
      onSelect(selectedFood, quantityInGrams);
      setSelectedFood(null);
      setQuantity(100);
      setUnit("grams");
    }
  };

  const calculateNutrition = (food: FoodItem, qty: number) => {
    // High precision calculation
    const multiplier = qty / 100;
    return {
      calories: Math.round(food.calories_per_100g * multiplier * 100) / 100,
      protein: Math.round(food.protein_per_100g * multiplier * 100) / 100,
      carbs: Math.round(food.carbs_per_100g * multiplier * 100) / 100,
      fats: Math.round(food.fats_per_100g * multiplier * 100) / 100,
      fiber: Math.round((food.fiber_per_100g || 0) * multiplier * 100) / 100,
      magnesium: Math.round((food.magnesium_per_100g || 0) * multiplier * 100) / 100,
      zinc: Math.round((food.zinc_per_100g || 0) * multiplier * 100) / 100,
    };
  };

  // Get current quantity in grams for display
  const getQuantityInGrams = () => {
    if (unit === "bowl" && selectedFood?.bowl_size_g) {
      return quantity * selectedFood.bowl_size_g;
    }
    return quantity;
  };

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <Input
          placeholder="Search foods (e.g., paneer, dal, roti...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10"
        />
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (query.length >= 2 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-auto"
          >
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {query.length >= 2
                  ? "No foods found. Try a different search."
                  : "Type at least 2 characters to search"}
              </div>
            ) : (
              <div className="py-2">
                {results.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => handleSelectFood(food)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {food.name_english}
                        </span>
                        {food.is_high_protein && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {food.calories_per_100g} cal | {food.protein_per_100g}g protein per 100g
                        {food.bowl_size_g && ` | ~${food.bowl_size_g}g per bowl`}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Food with Quantity */}
      <AnimatePresence>
        {selectedFood && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 rounded-lg bg-background border border-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-white flex items-center gap-2">
                  {selectedFood.name_english}
                  {selectedFood.is_high_protein && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                      High Protein
                    </span>
                  )}
                </h4>
                {selectedFood.has_typical_tadka && (
                  <p className="text-xs text-yellow-400 mt-1">
                    ⚠️ Typically prepared with {selectedFood.typical_tadka_oil_ml}ml
                    oil (tadka)
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="p-1 rounded hover:bg-card transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Quantity Input with Unit Selection */}
            <div className="space-y-3 mb-4">
              {/* Unit Selector */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setUnit("grams");
                    if (selectedFood?.bowl_size_g && quantity === selectedFood.bowl_size_g) {
                      setQuantity(100);
                    }
                  }}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    unit === "grams"
                      ? "bg-primary text-white"
                      : "bg-card border border-border hover:border-primary/50 text-white"
                  )}
                >
                  Grams
                </button>
                {selectedFood?.bowl_size_g && (
                  <button
                    onClick={() => {
                      setUnit("bowl");
                      setQuantity(1);
                    }}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      unit === "bowl"
                        ? "bg-primary text-white"
                        : "bg-card border border-border hover:border-primary/50 text-white"
                    )}
                  >
                    Bowl ({selectedFood.bowl_size_g}g)
                  </button>
                )}
              </div>

              {/* Quantity Input */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Quantity ({unit === "bowl" ? "bowls" : "grams"})
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={0.1}
                    step={unit === "bowl" ? 0.5 : 1}
                    className="text-center"
                  />
                  {unit === "bowl" && selectedFood?.bowl_size_g && (
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      = {Math.round(quantity * selectedFood.bowl_size_g)}g
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {unit === "grams" ? (
                    [50, 100, 150, 200, 250].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setQuantity(qty)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-colors",
                          quantity === qty
                            ? "bg-primary text-white"
                            : "bg-card border border-border hover:border-primary/50"
                        )}
                      >
                        {qty}g
                      </button>
                    ))
                  ) : (
                    [0.5, 1, 1.5, 2].map((qty) => (
                      <button
                        key={qty}
                        onClick={() => setQuantity(qty)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-colors",
                          quantity === qty
                            ? "bg-primary text-white"
                            : "bg-card border border-border hover:border-primary/50"
                        )}
                      >
                        {qty}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Nutrition Preview - High Precision */}
            <div className="space-y-2 mb-4">
              <div className="grid grid-cols-4 gap-2">
                {(() => {
                  const qtyInGrams = getQuantityInGrams();
                  const nutrition = calculateNutrition(selectedFood, qtyInGrams);
                  return (
                    <>
                      <div className="text-center p-2 rounded-lg bg-card">
                        <p className="text-lg font-bold text-primary">
                          {Math.round(nutrition.calories)}
                        </p>
                        <p className="text-xs text-muted-foreground">cal</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-card">
                        <p className="text-lg font-bold text-green-400">
                          {nutrition.protein.toFixed(1)}g
                        </p>
                        <p className="text-xs text-muted-foreground">protein</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-card">
                        <p className="text-lg font-bold text-blue-400">
                          {nutrition.carbs.toFixed(1)}g
                        </p>
                        <p className="text-xs text-muted-foreground">carbs</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-card">
                        <p className="text-lg font-bold text-yellow-400">
                          {nutrition.fats.toFixed(1)}g
                        </p>
                        <p className="text-xs text-muted-foreground">fats</p>
                      </div>
                    </>
                  );
                })()}
              </div>
              {/* Micronutrients */}
              {(() => {
                const qtyInGrams = getQuantityInGrams();
                const nutrition = calculateNutrition(selectedFood, qtyInGrams);
                return (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-1.5 rounded bg-background/50">
                      <span className="text-muted-foreground">Fiber: </span>
                      <span className="text-white font-medium">{nutrition.fiber.toFixed(1)}g</span>
                    </div>
                    <div className="text-center p-1.5 rounded bg-background/50">
                      <span className="text-muted-foreground">Mg: </span>
                      <span className="text-white font-medium">{nutrition.magnesium.toFixed(1)}mg</span>
                    </div>
                    <div className="text-center p-1.5 rounded bg-background/50">
                      <span className="text-muted-foreground">Zn: </span>
                      <span className="text-white font-medium">{nutrition.zinc.toFixed(2)}mg</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddFood}
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add to Meal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

