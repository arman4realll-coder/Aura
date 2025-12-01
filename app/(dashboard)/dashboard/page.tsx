"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Plus,
  Zap,
  TrendingUp,
  Droplets,
  Pill,
  Leaf,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/lib/store/game-store";
import { XPBar } from "@/components/game/xp-bar";
import { HPBar } from "@/components/game/hp-bar";
import { StreakCounter } from "@/components/game/streak-counter";
import { RankBadge } from "@/components/game/rank-badge";
import { DailyProgress } from "@/components/dashboard/progress-bars";
import { MealCard } from "@/components/meals/meal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MealLog, DailyProgress as DailyProgressType } from "@/types";

const MICRONUTRIENTS = [
  { key: "magnesium", label: "Magnesium", target: 400, unit: "mg", icon: Droplets },
  { key: "zinc", label: "Zinc", target: 15, unit: "mg", icon: Zap },
  { key: "fiber", label: "Fiber", target: 40, unit: "g", icon: Leaf },
  { key: "vitamin_d", label: "Vitamin D", target: 600, unit: "IU", icon: Pill },
  { key: "b12", label: "B12", target: 2.4, unit: "mcg", icon: Pill },
];

export default function DashboardPage() {
  const { profile, dailyProgress, setDailyProgress, rank, currentLevel } = useGameStore();
  const [todaysMeals, setTodaysMeals] = useState<MealLog[]>([]);
  const [microProgress, setMicroProgress] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!profile) return;

      const supabase = createClient();
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch today's meals
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", profile.id)
        .eq("meal_date", today)
        .order("meal_time", { ascending: true });

      if (meals) {
        setTodaysMeals(meals as MealLog[]);

        // Calculate daily totals
        const totals = meals.reduce(
          (acc, meal) => ({
            calories: acc.calories + (meal.total_calories || 0),
            protein: acc.protein + (meal.total_protein_g || 0),
            carbs: acc.carbs + (meal.total_carbs_g || 0),
            fats: acc.fats + (meal.total_fats_g || 0),
            fiber: acc.fiber + (meal.total_fiber_g || 0),
            magnesium: acc.magnesium + (meal.total_magnesium_mg || 0),
            zinc: acc.zinc + (meal.total_zinc_mg || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, magnesium: 0, zinc: 0 }
        );

        setDailyProgress({
          calories: { current: totals.calories, target: profile.calories_target },
          protein: { current: totals.protein, target: profile.protein_target_g },
          carbs: { current: totals.carbs, target: profile.carbs_target_g },
          fats: { current: totals.fats, target: profile.fats_target_g },
          fiber: { current: totals.fiber, target: profile.fiber_target_g },
          magnesium: { current: totals.magnesium, target: profile.magnesium_target_mg },
          zinc: { current: totals.zinc, target: profile.zinc_target_mg },
        });

        setMicroProgress({
          magnesium: totals.magnesium,
          zinc: totals.zinc,
          fiber: totals.fiber,
          vitamin_d: 0, // These would come from meal data if tracked
          b12: 0,
        });
      }

      setIsLoading(false);
    };

    loadDashboardData();

    // Set up realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel("meal_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meal_logs",
          filter: `user_id=eq.${profile?.id}`,
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, setDailyProgress]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Welcome back, {profile.display_name?.split(" ")[0] || "Player"} 👋
          </h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Link href="/log-meal">
          <Button className="w-full lg:w-auto">
            <Plus className="w-5 h-5 mr-2" />
            Log Meal
          </Button>
        </Link>
      </motion.div>

      {/* Player Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glow-orange border-primary/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <RankBadge rank={rank} size="md" showLabel={false} />
                <div>
                  <p className="text-xl font-bold">Level {currentLevel}</p>
                  <p className="text-sm text-muted-foreground font-normal">{rank}</p>
                </div>
              </CardTitle>
              <StreakCounter variant="compact" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <XPBar />
            <HPBar />
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyProgress progress={dailyProgress} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Micronutrients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-purple-400" />
                Micronutrients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MICRONUTRIENTS.map((micro) => {
                  const current = microProgress[micro.key] || 0;
                  const percentage = Math.min((current / micro.target) * 100, 100);
                  const isLow = percentage < 30;
                  const isGood = percentage >= 80;

                  return (
                    <div
                      key={micro.key}
                      className="flex items-center gap-3 p-2 rounded-lg bg-background/50"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isLow
                            ? "bg-red-500/20"
                            : isGood
                            ? "bg-green-500/20"
                            : "bg-yellow-500/20"
                        )}
                      >
                        {isLow ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : isGood ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <micro.icon className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{micro.label}</span>
                          <span className="text-muted-foreground">
                            {Math.round(current)}/{micro.target}
                            {micro.unit}
                          </span>
                        </div>
                        <div className="h-1.5 bg-background rounded-full mt-1 overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full",
                              isLow
                                ? "bg-red-500"
                                : isGood
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Streak Counter (Full) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <StreakCounter />
      </motion.div>

      {/* Today's Meals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today&apos;s Meals</CardTitle>
              {todaysMeals.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {todaysMeals.length} meal{todaysMeals.length !== 1 ? "s" : ""} logged
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading meals...
              </div>
            ) : todaysMeals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No meals logged today. Start tracking to earn XP!
                </p>
                <Link href="/log-meal">
                  <Button>
                    <Plus className="w-5 h-5 mr-2" />
                    Log Your First Meal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {todaysMeals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

