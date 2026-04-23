import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns a schema-scoped query builder for the recipes schema.
 * Web: pass the @supabase/ssr client (cookie-based)
 * Mobile: pass the AsyncStorage-backed client
 *
 * Requires "recipes" added to Supabase Dashboard → Settings → API → Exposed schemas.
 */
export function recipesDb(supabase: SupabaseClient) {
  return supabase.schema('recipes')
}

export const USER_SETTINGS_COLUMNS =
  'calorie_target_min,calorie_target_max,protein_target_min,protein_target_max,carb_target_g,fat_target_g,tdee,food_restrictions,personal_context'
