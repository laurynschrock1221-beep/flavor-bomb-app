-- Migration 007 — add servings to recipes
ALTER TABLE recipes.recipes
  ADD COLUMN IF NOT EXISTS servings integer NOT NULL DEFAULT 1;
