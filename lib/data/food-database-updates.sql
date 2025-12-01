-- ====================================
-- FOOD DATABASE UPDATES
-- Add bowl_size_g column and update existing foods
-- ====================================

-- Add bowl_size_g column to food_database
ALTER TABLE food_database 
ADD COLUMN IF NOT EXISTS bowl_size_g DECIMAL(5,1);

-- Update existing foods with standard bowl sizes (in grams)
-- These are typical serving sizes for Indian foods

UPDATE food_database SET bowl_size_g = 200 WHERE category = 'dal' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 150 WHERE category = 'vegetable' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 100 WHERE category = 'dairy' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 80 WHERE category = 'roti' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 200 WHERE category = 'rice' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 150 WHERE category = 'meal' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 30 WHERE category = 'snack' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 100 WHERE category = 'protein' AND bowl_size_g IS NULL;

-- Specific updates for common foods
UPDATE food_database SET bowl_size_g = 200 WHERE name_english LIKE '%Dal%' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 150 WHERE name_english LIKE '%Sabji%' OR name_english LIKE '%Vegetable%' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 200 WHERE name_english LIKE '%Rice%' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 100 WHERE name_english = 'Paneer' AND bowl_size_g IS NULL;
UPDATE food_database SET bowl_size_g = 150 WHERE name_english LIKE '%Khichdi%' OR name_english LIKE '%Poha%' OR name_english LIKE '%Upma%' AND bowl_size_g IS NULL;

-- Add index for faster searches
CREATE INDEX IF NOT EXISTS idx_food_category ON food_database(category);
CREATE INDEX IF NOT EXISTS idx_food_high_protein ON food_database(is_high_protein) WHERE is_high_protein = true;

