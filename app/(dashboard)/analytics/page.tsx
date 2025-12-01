"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format, subDays, startOfWeek, eachDayOfInterval } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Zap, Target, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useGameStore } from "@/lib/store/game-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const COLORS = {
  protein: "#22c55e",
  carbs: "#3b82f6",
  fats: "#eab308",
  calories: "#f97316",
  xp: "#fbbf24",
};

interface DayData {
  date: string;
  day: string;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  xp: number;
  goalHit: boolean;
}

export default function AnalyticsPage() {
  const { profile } = useGameStore();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [streakHistory, setStreakHistory] = useState<{ date: string; hit: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!profile) return;

      const supabase = createClient();
      const today = new Date();
      const sevenDaysAgo = subDays(today, 6);

      // Get daily summaries for the past 7 days
      const { data: summaries } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("user_id", profile.id)
        .gte("summary_date", format(sevenDaysAgo, "yyyy-MM-dd"))
        .order("summary_date", { ascending: true });

      // Create data for all 7 days
      const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });
      const chartData: DayData[] = days.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const summary = summaries?.find((s) => s.summary_date === dateStr);

        return {
          date: dateStr,
          day: format(day, "EEE"),
          protein: summary?.total_protein_g || 0,
          carbs: summary?.total_carbs_g || 0,
          fats: summary?.total_fats_g || 0,
          calories: summary?.total_calories || 0,
          xp: summary?.xp_gained_today || 0,
          goalHit: summary?.protein_goal_hit || false,
        };
      });

      setWeekData(chartData);

      // Get 30 days for streak calendar
      const thirtyDaysAgo = subDays(today, 29);
      const { data: monthSummaries } = await supabase
        .from("daily_summaries")
        .select("summary_date, protein_goal_hit")
        .eq("user_id", profile.id)
        .gte("summary_date", format(thirtyDaysAgo, "yyyy-MM-dd"))
        .order("summary_date", { ascending: true });

      const monthDays = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
      const streakData = monthDays.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const summary = monthSummaries?.find((s) => s.summary_date === dateStr);
        return {
          date: dateStr,
          hit: summary?.protein_goal_hit || false,
        };
      });

      setStreakHistory(streakData);
      setIsLoading(false);
    };

    loadAnalytics();
  }, [profile]);

  // Calculate macro distribution for today
  const todayMacros = weekData[weekData.length - 1] || {
    protein: 0,
    carbs: 0,
    fats: 0,
  };
  const totalMacros = todayMacros.protein + todayMacros.carbs + todayMacros.fats;
  const macroDistribution = [
    { name: "Protein", value: todayMacros.protein, color: COLORS.protein },
    { name: "Carbs", value: todayMacros.carbs, color: COLORS.carbs },
    { name: "Fats", value: todayMacros.fats, color: COLORS.fats },
  ];

  // Calculate weekly stats
  const weeklyStats = {
    totalXP: weekData.reduce((sum, day) => sum + day.xp, 0),
    avgProtein: Math.round(
      weekData.reduce((sum, day) => sum + day.protein, 0) / Math.max(weekData.length, 1)
    ),
    avgCalories: Math.round(
      weekData.reduce((sum, day) => sum + day.calories, 0) / Math.max(weekData.length, 1)
    ),
    goalDays: weekData.filter((day) => day.goalHit).length,
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-muted-foreground">
          Track your progress over time
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{weeklyStats.totalXP}</p>
                <p className="text-xs text-muted-foreground">XP this week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{weeklyStats.avgProtein}g</p>
                <p className="text-xs text-muted-foreground">Avg protein/day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{weeklyStats.avgCalories}</p>
                <p className="text-xs text-muted-foreground">Avg calories/day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{weeklyStats.goalDays}/7</p>
                <p className="text-xs text-muted-foreground">Goals hit this week</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 7-Day Protein Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                7-Day Protein Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="protein"
                      stroke={COLORS.protein}
                      strokeWidth={3}
                      dot={{ fill: COLORS.protein, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    {/* Target line */}
                    <Line
                      type="monotone"
                      dataKey={() => profile.protein_target_g}
                      stroke="#666"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Target: {profile.protein_target_g}g/day (dashed line)
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly XP */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Weekly XP Gained
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Bar
                      dataKey="xp"
                      fill={COLORS.xp}
                      radius={[4, 4, 0, 0]}
                      name="XP"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Macro Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Macro Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {macroDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value}g`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {macroDistribution.map((macro) => (
                  <div key={macro.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: macro.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {macro.name}: {macro.value}g
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                30-Day Streak Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div
                    key={day}
                    className="text-xs text-center text-muted-foreground pb-2"
                  >
                    {day}
                  </div>
                ))}
                {/* Empty cells for alignment */}
                {(() => {
                  const firstDay = streakHistory[0];
                  if (!firstDay) return null;
                  const dayOfWeek = new Date(firstDay.date).getDay();
                  const emptyCells = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  return Array(emptyCells)
                    .fill(null)
                    .map((_, i) => <div key={`empty-${i}`} className="w-8 h-8" />);
                })()}
                {streakHistory.map((day) => (
                  <motion.div
                    key={day.date}
                    whileHover={{ scale: 1.2 }}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer",
                      day.hit
                        ? "bg-primary text-white"
                        : "bg-background text-muted-foreground"
                    )}
                    title={`${format(new Date(day.date), "MMM d")}: ${
                      day.hit ? "Goal hit!" : "Goal missed"
                    }`}
                  >
                    {format(new Date(day.date), "d")}
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span className="text-xs text-muted-foreground">Goal hit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-background" />
                  <span className="text-xs text-muted-foreground">Goal missed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

