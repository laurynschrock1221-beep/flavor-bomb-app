-- Migration 003 — add snack and side to meal_type check constraint
ALTER TABLE recipes.recipes
  DROP CONSTRAINT IF EXISTS recipes_meal_type_check;

ALTER TABLE recipes.recipes
  ADD CONSTRAINT recipes_meal_type_check
  CHECK (meal_type IN ('breakfast','lunch','dinner','snack','side'));
