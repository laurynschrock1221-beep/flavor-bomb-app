-- ============================================================
-- Migration 002 — planned_day_types
-- Proactive day-type scheduling for the weekly planner.
-- Separate from reactive inference in activity_logs.
-- Uses composite PK (user_id, date) — no surrogate id needed.
-- ============================================================

CREATE TABLE IF NOT EXISTS recipes.planned_day_types (
  user_id  uuid  REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date     text  NOT NULL,              -- 'YYYY-MM-DD'
  day_type text  NOT NULL CHECK (day_type IN ('rest','moderate','high')),
  PRIMARY KEY (user_id, date)
);

ALTER TABLE recipes.planned_day_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planned_day_types: users own their rows"
  ON recipes.planned_day_types FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON recipes.planned_day_types TO authenticated, service_role;
