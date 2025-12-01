"use client";

import { motion } from "framer-motion";
import { Flame, Target, Zap, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-primary/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Aura</span>
          </div>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </motion.header>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium border border-primary/30">
              🎮 Gamified Nutrition Tracking
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Level Up Your{" "}
            <span className="text-gradient bg-gradient-to-r from-primary-400 to-primary-600">
              Biology
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-2xl mb-8"
          >
            Transform eating into an RPG adventure. Track macros, earn XP,
            maintain streaks, and watch your body transform as you climb the
            ranks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/signup" className="btn-primary flex items-center gap-2 text-lg">
              Start Your Journey
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary flex items-center gap-2 text-lg">
              Continue Quest
            </Link>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-12"
        >
          {[
            {
              icon: Zap,
              title: "XP System",
              description: "Earn experience points for every protein-rich meal",
              color: "text-yellow-500",
            },
            {
              icon: Target,
              title: "HP Bar",
              description: "Track your health with our unique HP system",
              color: "text-red-500",
            },
            {
              icon: Flame,
              title: "Streaks",
              description: "Build momentum with daily protein goal streaks",
              color: "text-primary",
            },
            {
              icon: TrendingUp,
              title: "Level Up",
              description: "Climb from Novice to Titan with consistent effort",
              color: "text-green-500",
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="glass-card p-6 hover:border-primary/50 transition-colors"
            >
              <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <footer className="text-center text-muted py-4">
          <p className="text-sm">
            Built for young Indian males pursuing body recomposition 💪
          </p>
        </footer>
      </div>
    </main>
  );
}

