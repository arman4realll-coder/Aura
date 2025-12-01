"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, subDays, isToday, isYesterday, parseISO } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/lib/store/game-store";
import { MealCard } from "@/components/meals/meal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MealLog } from "@/types";

interface DayGroup {
  date: string;
  displayDate: string;
  meals: MealLog[];
  totalCalories: number;
  totalProtein: number;
  xpEarned: number;
}

export default function HistoryPage() {
  const { profile } = useGameStore();
  const [mealHistory, setMealHistory] = useState<DayGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 7),
    end: new Date(),
  });

  useEffect(() => {
    const loadHistory = async () => {
      if (!profile) return;

      const supabase = createClient();
      const { data: meals } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", profile.id)
        .gte("meal_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("meal_date", format(dateRange.end, "yyyy-MM-dd"))
        .order("meal_date", { ascending: false })
        .order("meal_time", { ascending: false });

      if (meals) {
        // Group meals by date
        const groupedMeals: Record<string, MealLog[]> = {};
        meals.forEach((meal) => {
          const date = meal.meal_date;
          if (!groupedMeals[date]) {
            groupedMeals[date] = [];
          }
          groupedMeals[date].push(meal as MealLog);
        });

        // Convert to array with stats
        const dayGroups: DayGroup[] = Object.entries(groupedMeals).map(
          ([date, dayMeals]) => {
            const parsedDate = parseISO(date);
            let displayDate = format(parsedDate, "EEEE, MMMM d");
            if (isToday(parsedDate)) displayDate = "Today";
            else if (isYesterday(parsedDate)) displayDate = "Yesterday";

            return {
              date,
              displayDate,
              meals: dayMeals,
              totalCalories: dayMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0),
              totalProtein: dayMeals.reduce((sum, m) => sum + (m.total_protein_g || 0), 0),
              xpEarned: dayMeals.reduce((sum, m) => sum + (m.xp_earned || 0), 0),
            };
          }
        );

        setMealHistory(dayGroups);
      }

      setIsLoading(false);
    };

    loadHistory();
  }, [profile, dateRange]);

  const handlePreviousWeek = () => {
    setDateRange({
      start: subDays(dateRange.start, 7),
      end: subDays(dateRange.end, 7),
    });
  };

  const handleNextWeek = () => {
    const newEnd = new Date(dateRange.end);
    newEnd.setDate(newEnd.getDate() + 7);
    if (newEnd > new Date()) {
      setDateRange({
        start: subDays(new Date(), 7),
        end: new Date(),
      });
    } else {
      setDateRange({
        start: new Date(dateRange.start.getTime() + 7 * 24 * 60 * 60 * 1000),
        end: newEnd,
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Meal History
          </h1>
          <p className="text-muted-foreground">
            Review your past meals and progress
          </p>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-white">
              {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d")}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            disabled={format(dateRange.end, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* History Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading history...
        </div>
      ) : mealHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No meals logged during this period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {mealHistory.map((day, dayIndex) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {day.displayDate}
                </h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {Math.round(day.totalCalories)} cal
                  </span>
                  <span className="text-green-400">
                    {Math.round(day.totalProtein)}g protein
                  </span>
                  <span className="text-yellow-400">+{day.xpEarned} XP</span>
                </div>
              </div>

              {/* Meals */}
              <div className="space-y-4">
                {day.meals.map((meal) => (
                  <MealCard key={meal.id} meal={meal} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

