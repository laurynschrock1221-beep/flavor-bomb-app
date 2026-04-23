-- Migration 006 — user equipment preferences
CREATE TABLE IF NOT EXISTS recipes.user_equipment (
  user_id    uuid  PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  equipment  text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE recipes.user_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_equipment: users own their row"
  ON recipes.user_equipment FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON recipes.user_equipment TO authenticated, service_role;
