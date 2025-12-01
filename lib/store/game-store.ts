import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameState, Profile, DailyProgress } from "@/types";

interface GameStore extends GameState {
  // Profile data
  profile: Profile | null;
  dailyProgress: DailyProgress;

  // Actions
  setProfile: (profile: Profile) => void;
  updateGameStats: (stats: Partial<GameState>) => void;
  addXP: (amount: number) => void;
  updateHP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  setDailyProgress: (progress: DailyProgress) => void;
  triggerLevelUp: () => void;
  clearLevelUp: () => void;
  showXPGain: (amount: number) => void;
  clearXPGain: () => void;
  reset: () => void;
}

const initialDailyProgress: DailyProgress = {
  calories: { current: 0, target: 2200 },
  protein: { current: 0, target: 120 },
  carbs: { current: 0, target: 250 },
  fats: { current: 0, target: 50 },
  fiber: { current: 0, target: 40 },
  magnesium: { current: 0, target: 400 },
  zinc: { current: 0, target: 15 },
};

const initialGameState: GameState = {
  totalXP: 0,
  currentLevel: 1,
  currentHP: 100,
  maxHP: 100,
  currentStreak: 0,
  rank: "Novice",
  isLevelingUp: false,
  xpGainAnimation: null,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialGameState,
      profile: null,
      dailyProgress: initialDailyProgress,

      setProfile: (profile) => {
        set({
          profile,
          totalXP: profile.total_xp,
          currentLevel: profile.current_level,
          currentHP: profile.current_hp,
          maxHP: profile.max_hp,
          currentStreak: profile.current_streak,
          rank: profile.rank,
          dailyProgress: {
            calories: { current: 0, target: profile.calories_target },
            protein: { current: 0, target: profile.protein_target_g },
            carbs: { current: 0, target: profile.carbs_target_g },
            fats: { current: 0, target: profile.fats_target_g },
            fiber: { current: 0, target: profile.fiber_target_g },
            magnesium: { current: 0, target: profile.magnesium_target_mg },
            zinc: { current: 0, target: profile.zinc_target_mg },
          },
        });
      },

      updateGameStats: (stats) => set(stats),

      addXP: (amount) => {
        const { totalXP, currentLevel } = get();
        const newTotalXP = totalXP + amount;

        // Calculate new level
        const { calculateLevel, getRank } = require("@/lib/calculations/gamification");
        const newLevel = calculateLevel(newTotalXP);
        const newRank = getRank(newLevel);

        const shouldLevelUp = newLevel > currentLevel;

        set({
          totalXP: newTotalXP,
          currentLevel: newLevel,
          rank: newRank,
          isLevelingUp: shouldLevelUp,
          xpGainAnimation: amount,
        });

        // Clear XP animation after 1.5 seconds
        setTimeout(() => {
          set({ xpGainAnimation: null });
        }, 1500);
      },

      updateHP: (amount) => {
        const { currentHP, maxHP } = get();
        const newHP = Math.max(0, Math.min(maxHP, currentHP + amount));
        set({ currentHP: newHP });
      },

      incrementStreak: () => {
        const { currentStreak, profile } = get();
        const newStreak = currentStreak + 1;
        const longestStreak = profile
          ? Math.max(profile.longest_streak, newStreak)
          : newStreak;
        set({
          currentStreak: newStreak,
          profile: profile
            ? { ...profile, current_streak: newStreak, longest_streak: longestStreak }
            : null,
        });
      },

      resetStreak: () => set({ currentStreak: 0 }),

      setDailyProgress: (progress) => set({ dailyProgress: progress }),

      triggerLevelUp: () => set({ isLevelingUp: true }),

      clearLevelUp: () => set({ isLevelingUp: false }),

      showXPGain: (amount) => set({ xpGainAnimation: amount }),

      clearXPGain: () => set({ xpGainAnimation: null }),

      reset: () =>
        set({
          ...initialGameState,
          profile: null,
          dailyProgress: initialDailyProgress,
        }),
    }),
    {
      name: "aura-game-store",
      partialize: (state) => ({
        totalXP: state.totalXP,
        currentLevel: state.currentLevel,
        currentHP: state.currentHP,
        maxHP: state.maxHP,
        currentStreak: state.currentStreak,
        rank: state.rank,
      }),
    }
  )
);

