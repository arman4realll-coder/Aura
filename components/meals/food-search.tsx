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

export function FoodSearch({ onSelect, region, className }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState(100);
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

      const { data } = await supabase
        .from("food_database")
        .select("*")
        .ilike("name_english", `%${query}%`)
        .order("is_high_protein", { ascending: false })
        .limit(10);

      if (data) {
        setResults(data as FoodItem[]);
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchFoods, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuery("");
    setResults([]);
  };

  const handleAddFood = () => {
    if (selectedFood && quantity > 0) {
      onSelect(selectedFood, quantity);
      setSelectedFood(null);
      setQuantity(100);
    }
  };

  const calculateNutrition = (food: FoodItem, qty: number) => {
    const multiplier = qty / 100;
    return {
      calories: Math.round(food.calories_per_100g * multiplier),
      protein: Math.round(food.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(food.carbs_per_100g * multiplier * 10) / 10,
      fats: Math.round(food.fats_per_100g * multiplier * 10) / 10,
    };
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
                        {food.calories_per_100g} cal | {food.protein_per_100g}g
                        protein per 100g
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

            {/* Quantity Input */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Quantity (grams)
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  className="text-center"
                />
              </div>
              <div className="flex gap-2">
                {[50, 100, 150, 200].map((qty) => (
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
                ))}
              </div>
            </div>

            {/* Nutrition Preview */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(() => {
                const nutrition = calculateNutrition(selectedFood, quantity);
                return (
                  <>
                    <div className="text-center p-2 rounded-lg bg-card">
                      <p className="text-lg font-bold text-primary">
                        {nutrition.calories}
                      </p>
                      <p className="text-xs text-muted-foreground">cal</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-card">
                      <p className="text-lg font-bold text-green-400">
                        {nutrition.protein}g
                      </p>
                      <p className="text-xs text-muted-foreground">protein</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-card">
                      <p className="text-lg font-bold text-blue-400">
                        {nutrition.carbs}g
                      </p>
                      <p className="text-xs text-muted-foreground">carbs</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-card">
                      <p className="text-lg font-bold text-yellow-400">
                        {nutrition.fats}g
                      </p>
                      <p className="text-xs text-muted-foreground">fats</p>
                    </div>
                  </>
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

