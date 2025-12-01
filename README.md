# 🔥 Aura - Gamified Nutrition Tracker

Transform eating into an RPG adventure! Track macros, earn XP, maintain streaks, and level up your biology through optimal nutrition.

![Aura Banner](https://via.placeholder.com/1200x400/0f172a/f97316?text=AURA+-+Level+Up+Your+Nutrition)

## ✨ Features

- **🎮 Gamification System**: Earn XP, level up, maintain HP, and climb ranks from Novice to Titan
- **📊 Macro Tracking**: Track protein, carbs, fats, and micronutrients (Mg, Zn, Fiber)
- **🔥 Streak System**: Build daily streaks by hitting your protein goals
- **🍛 Indian Food Database**: Pre-loaded with popular Indian foods including regional variations
- **⚠️ Debuff Detection**: Automatic detection of "Gujju Trap" (sugar in dal) and hidden oil
- **🤖 Smart Coach Tips**: AI-generated tips based on your meal composition
- **📈 Analytics Dashboard**: Visualize your progress with charts and heatmaps
- **📱 Mobile-First PWA**: Install on any device as a Progressive Web App

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
cd Aura
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema (see below)
3. Copy your project URL and anon key

### 3. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📦 Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Table 1: User Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Physical Stats
  height_cm DECIMAL(5,2) NOT NULL,
  current_weight_kg DECIMAL(5,2) NOT NULL,
  starting_weight_kg DECIMAL(5,2) NOT NULL,
  target_weight_kg DECIMAL(5,2),
  age INTEGER NOT NULL,
  body_type TEXT CHECK (body_type IN ('ectomorph', 'mesomorph', 'endomorph')),
  
  -- Diet Preferences
  is_vegetarian BOOLEAN DEFAULT true,
  dietary_region TEXT DEFAULT 'Gujarat',
  
  -- Daily Targets (OPTIMIZED FOR PEAK PERFORMANCE)
  protein_target_g INTEGER DEFAULT 150, -- 2.5g/kg for elite muscle building
  carbs_target_g INTEGER DEFAULT 300, -- Higher for optimal performance
  fats_target_g INTEGER DEFAULT 70, -- 1.2g/kg for hormone optimization
  calories_target INTEGER DEFAULT 2500, -- Higher baseline for active individuals
  magnesium_target_mg INTEGER DEFAULT 600, -- 50% above RDA for recovery
  zinc_target_mg INTEGER DEFAULT 20, -- 33% above RDA for testosterone
  fiber_target_g INTEGER DEFAULT 50, -- 25% above RDA for gut health
  
  -- Game Stats
  total_xp BIGINT DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_hp INTEGER DEFAULT 100,
  max_hp INTEGER DEFAULT 100,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_log_date DATE,
  rank TEXT DEFAULT 'Novice' CHECK (rank IN ('Novice', 'Soldier', 'Elite', 'Titan'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Table 2: Meal Logs
CREATE TABLE meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME DEFAULT CURRENT_TIME,
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  
  items JSONB NOT NULL,
  total_calories DECIMAL(7,2) NOT NULL,
  total_protein_g DECIMAL(6,2) NOT NULL,
  total_carbs_g DECIMAL(6,2) NOT NULL,
  total_fats_g DECIMAL(6,2) NOT NULL,
  total_fiber_g DECIMAL(5,2) DEFAULT 0,
  total_magnesium_mg DECIMAL(6,2) DEFAULT 0,
  total_zinc_mg DECIMAL(5,2) DEFAULT 0,
  
  has_hidden_oil BOOLEAN DEFAULT false,
  has_gujju_sugar BOOLEAN DEFAULT false,
  tadka_oil_ml DECIMAL(4,1) DEFAULT 0,
  
  xp_earned INTEGER DEFAULT 0,
  hp_impact INTEGER DEFAULT 0,
  coach_tip TEXT,
  optimization_score INTEGER CHECK (optimization_score BETWEEN 0 AND 100)
);

CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, meal_date DESC);
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meals" ON meal_logs FOR ALL USING (auth.uid() = user_id);

-- Table 3: Daily Summaries
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_calories DECIMAL(8,2) DEFAULT 0,
  total_protein_g DECIMAL(7,2) DEFAULT 0,
  total_carbs_g DECIMAL(7,2) DEFAULT 0,
  total_fats_g DECIMAL(7,2) DEFAULT 0,
  xp_gained_today INTEGER DEFAULT 0,
  hp_end_of_day INTEGER DEFAULT 100,
  protein_goal_hit BOOLEAN DEFAULT false,
  UNIQUE(user_id, summary_date)
);

ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own summaries" ON daily_summaries FOR ALL USING (auth.uid() = user_id);

-- Table 4: Food Database
CREATE TABLE food_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_english TEXT NOT NULL,
  name_gujarati TEXT,
  category TEXT NOT NULL,
  calories_per_100g DECIMAL(6,2) NOT NULL,
  protein_per_100g DECIMAL(5,2) NOT NULL,
  carbs_per_100g DECIMAL(5,2) NOT NULL,
  fats_per_100g DECIMAL(5,2) NOT NULL,
  fiber_per_100g DECIMAL(5,2) DEFAULT 0,
  magnesium_per_100g DECIMAL(5,2) DEFAULT 0,
  zinc_per_100g DECIMAL(4,2) DEFAULT 0,
  is_high_protein BOOLEAN DEFAULT false,
  has_typical_tadka BOOLEAN DEFAULT false,
  typical_tadka_oil_ml DECIMAL(4,1),
  bowl_size_g DECIMAL(5,1) -- Standard bowl size in grams (e.g., 200g for dal)
);

CREATE INDEX idx_food_name ON food_database(name_english);

-- Seed with Indian foods (see lib/data/food-database.ts for full list)
INSERT INTO food_database (name_english, name_gujarati, category, calories_per_100g, protein_per_100g, carbs_per_100g, fats_per_100g, fiber_per_100g, magnesium_per_100g, zinc_per_100g, is_high_protein, has_typical_tadka, typical_tadka_oil_ml) VALUES
('Paneer', 'પનીર', 'dairy', 265, 18.3, 1.2, 20.8, 0, 23, 2.7, true, false, NULL),
('Greek Yogurt', 'ગ્રીક દહીં', 'dairy', 59, 10.0, 3.6, 0.4, 0, 11, 0.5, true, false, NULL),
('Moong Dal (cooked)', 'મગ દાળ', 'dal', 105, 7.0, 19.0, 0.4, 7.6, 54, 1.4, false, true, 10),
('Roti (whole wheat)', 'રોટલી', 'roti', 297, 11.0, 61.0, 1.7, 12.0, 138, 2.9, false, false, NULL),
('White Rice (cooked)', 'ભાત', 'rice', 130, 2.7, 28.0, 0.3, 0.4, 12, 0.5, false, false, NULL),
('Soya Chunks (cooked)', 'સોયા', 'protein', 336, 52.0, 30.0, 0.5, 13.0, 280, 4.9, true, true, 10),
('Egg (whole, boiled)', NULL, 'protein', 155, 12.6, 1.1, 10.6, 0, 12, 1.3, true, false, NULL),
('Pumpkin Seeds', NULL, 'snack', 559, 30.2, 10.7, 49.1, 6.0, 592, 7.8, true, false, NULL);
```

## 🎮 Gamification System

### XP Calculation
- **Base XP**: +10 per 10g protein
- **Bonuses**: 
  - High protein meal (30g+): +25 XP
  - Fiber champion (10g+): +20 XP
  - Magnesium boost: +50 XP
  - Zinc power: +50 XP
- **Penalties**:
  - Gujju Trap (sugar): -20 XP
  - Hidden oil tax: -30 XP

### HP System
- Start with 100 HP
- **Damage**: Sugar spikes (-10), Hidden oil (-15)
- **Recovery**: High protein (+5), High fiber (+5)

### Ranks
| Level | Rank |
|-------|------|
| 1-9 | Novice |
| 10-29 | Soldier |
| 30-69 | Elite |
| 70+ | Titan |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod

## 📱 PWA Installation

1. Open the app in Chrome/Safari
2. Click "Add to Home Screen" 
3. Enjoy native-like experience!

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📂 Project Structure

```
aura/
├── app/
│   ├── (auth)/          # Auth pages (login, signup, onboarding)
│   ├── (dashboard)/     # Protected dashboard pages
│   └── auth/callback/   # OAuth callback handler
├── components/
│   ├── game/            # XP bar, HP bar, level-up animation
│   ├── meals/           # Food search, meal cards
│   └── ui/              # Reusable UI components
├── lib/
│   ├── calculations/    # XP, HP, macro calculators
│   ├── store/           # Zustand game store
│   └── supabase/        # Database client
└── types/               # TypeScript definitions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with 🔥 for young Indian males pursuing body recomposition.

**Level up your nutrition. Transform your biology. Become a Titan.**

