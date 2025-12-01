-- ====================================
-- FOOD DATABASE UPDATES - PHASE 2 (AI Features)
-- Add unit_size_g column and tags for smart search
-- ====================================

-- Add unit_size_g column for countable items
ALTER TABLE food_database 
ADD COLUMN IF NOT EXISTS unit_size_g DECIMAL(5,1);

-- Add tags array for semantic search (Postgres array type)
ALTER TABLE food_database 
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Update existing foods with unit sizes (in grams)
UPDATE food_database SET unit_size_g = 40 WHERE category = 'roti' AND unit_size_g IS NULL; -- 1 Roti ~ 40g
UPDATE food_database SET unit_size_g = 50 WHERE name_english ILIKE '%Egg%' AND unit_size_g IS NULL; -- 1 Egg ~ 50g
UPDATE food_database SET unit_size_g = 150 WHERE name_english ILIKE '%Apple%' OR name_english ILIKE '%Banana%' AND unit_size_g IS NULL; -- Fruits
UPDATE food_database SET unit_size_g = 30 WHERE category = 'snack' AND name_english ILIKE '%Ladoo%' AND unit_size_g IS NULL;

-- Add AI Tags for semantic search simulation
UPDATE food_database SET tags = ARRAY['muscle', 'recovery', 'strength', 'gym'] WHERE is_high_protein = true;
UPDATE food_database SET tags = ARRAY['energy', 'fuel', 'carb_loading'] WHERE category IN ('rice', 'roti');
UPDATE food_database SET tags = ARRAY['health', 'fiber', 'digestion', 'light'] WHERE category = 'vegetable';
UPDATE food_database SET tags = ARRAY['comfort', 'home', 'fiber'] WHERE category = 'dal';
UPDATE food_database SET tags = ARRAY['bone_health', 'calcium'] WHERE category = 'dairy';

-- Add index for tag search
CREATE INDEX IF NOT EXISTS idx_food_tags ON food_database USING GIN (tags);

