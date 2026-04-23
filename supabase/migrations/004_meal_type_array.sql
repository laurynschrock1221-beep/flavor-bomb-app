-- Migration 004 — change meal_type from text to text[]
-- Existing single values are wrapped into a one-element array.

ALTER TABLE recipes.recipes DROP CONSTRAINT IF EXISTS recipes_meal_type_check;

ALTER TABLE recipes.recipes
  ALTER COLUMN meal_type TYPE text[]
  USING CASE WHEN meal_type IS NULL THEN NULL ELSE ARRAY[meal_type] END;

ALTER TABLE recipes.recipes
  ADD CONSTRAINT recipes_meal_type_check
  CHECK (meal_type <@ ARRAY['breakfast','lunch','dinner','snack','side']::text[]);
