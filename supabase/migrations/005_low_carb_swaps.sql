-- Migration 005 — low carb swap columns on ingredients
ALTER TABLE recipes.ingredients
  ADD COLUMN IF NOT EXISTS lc_swap       text,
  ADD COLUMN IF NOT EXISTS lc_swap_macros jsonb;
