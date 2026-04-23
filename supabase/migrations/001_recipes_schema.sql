-- ============================================================
-- Migration 001 — recipes schema
-- All new tables in 'recipes' schema, no changes to public schema
-- Expose 'recipes' in Supabase Dashboard → Settings → API → Exposed schemas
-- ============================================================

CREATE SCHEMA IF NOT EXISTS recipes;

GRANT USAGE ON SCHEMA recipes TO authenticated, anon, service_role;

-- ────────────────────────────────────────────────────────────
-- recipes.recipes
-- NOTE: no computed macro columns — macros are calculated at
-- render time from ingredients via calcRecipeMacros() in macroCalc.ts
-- ────────────────────────────────────────────────────────────
CREATE TABLE recipes.recipes (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name             text        NOT NULL,
  cuisine          text,                         -- Korean / Mexican / Japanese / Asian / Mediterranean / Other
  meal_type        text        CHECK (meal_type IN ('breakfast','lunch','dinner')),
  description      text,
  tip              text,                         -- actionable pro tip
  instructions     text[]      NOT NULL DEFAULT '{}',
  cook_time        text,                         -- e.g. '20 min'
  prep_time        text,                         -- e.g. '10 min'
  emoji            text,                         -- single emoji
  tag              text,                         -- Blackstone / Air Fryer / No Cook / etc
  is_gf            boolean     NOT NULL DEFAULT false,
  source_image_url text,                         -- Supabase Storage path
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- recipes.ingredients
-- macros = {p, c, f, kcal} per single unit of quantity
-- e.g. quantity=6 unit='oz' macros={p:7,c:0,f:2.5,kcal:50} → 6x per oz
-- ────────────────────────────────────────────────────────────
CREATE TABLE recipes.ingredients (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   uuid        REFERENCES recipes.recipes ON DELETE CASCADE NOT NULL,
  name        text        NOT NULL,
  quantity    numeric,
  unit        text,                              -- cup/oz/tbsp/g/tsp/lb/cloves/etc
  category    text,                              -- Proteins / Produce / Pantry / Grains & Frozen / Dairy
  macros      jsonb,                             -- {p, c, f, kcal} per single unit (base)
  is_gf       boolean     NOT NULL DEFAULT true, -- false = needs a GF swap
  gf_swap     text,                              -- e.g. 'tamari' replaces 'soy sauce'
  swap_macros jsonb,                             -- {p, c, f, kcal} per unit for GF version
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- recipes.meal_plans
-- slots jsonb[] each: {day:0-6, meal_type, recipe_id, day_type}
-- day 0=Monday … 6=Sunday
-- ────────────────────────────────────────────────────────────
CREATE TABLE recipes.meal_plans (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  week_start   date        NOT NULL,             -- Monday of the week
  slots        jsonb[]     NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

-- ────────────────────────────────────────────────────────────
-- RLS
-- ────────────────────────────────────────────────────────────
ALTER TABLE recipes.recipes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes.meal_plans  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recipes: users own their rows" ON recipes.recipes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ingredients: users own their rows" ON recipes.ingredients
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM recipes.recipes WHERE id = recipe_id)
  );

CREATE POLICY "meal_plans: users own their rows" ON recipes.meal_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- Triggers
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION recipes.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes.recipes
  FOR EACH ROW EXECUTE FUNCTION recipes.set_updated_at();

CREATE TRIGGER meal_plans_updated_at
  BEFORE UPDATE ON recipes.meal_plans
  FOR EACH ROW EXECUTE FUNCTION recipes.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- Grants
-- ────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes.recipes     TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes.ingredients TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recipes.meal_plans  TO authenticated, service_role;
GRANT SELECT ON recipes.recipes     TO anon;
GRANT SELECT ON recipes.ingredients TO anon;
