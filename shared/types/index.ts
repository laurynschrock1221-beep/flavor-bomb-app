export type DayType  = 'rest' | 'moderate' | 'high'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'side'

/** Per-macro totals. All values in grams; kcal in kilocalories. */
export interface MacroSet {
  p:    number  // protein g
  c:    number  // carbs g
  f:    number  // fat g
  kcal: number
}

/** macro targets derived from user_settings for each day type */
export interface UserMacroTargets {
  rest:     MacroSet
  moderate: MacroSet
  high:     MacroSet
}

/** macros per single unit of an ingredient (base + optional GF swap) */
export interface Ingredient {
  id:          string
  recipe_id:   string
  name:        string
  quantity:    number | null
  unit:        string | null
  category:    string | null         // Proteins / Produce / Pantry / Grains & Frozen / Dairy
  macros:      MacroSet | null       // per single unit, base version
  is_gf:          boolean               // false = this ingredient needs a GF swap
  gf_swap:        string | null
  swap_macros:    MacroSet | null       // per single unit, GF version
  lc_swap:        string | null         // e.g. 'cauliflower rice'
  lc_swap_macros: MacroSet | null       // per single unit, LC version
  sort_order:  number
  created_at:  string
}

/** Full recipe row from recipes.recipes */
export interface Recipe {
  id:               string
  user_id:          string
  name:             string
  cuisine:          string | null    // Korean / Mexican / Japanese / Asian / Mediterranean / Other
  meal_type:        MealType[] | null
  description:      string | null
  tip:              string | null
  instructions:     string[]
  cook_time:        string | null    // e.g. '20 min'
  prep_time:        string | null    // e.g. '10 min'
  emoji:            string | null
  tag:              string | null    // Blackstone / Air Fryer / No Cook / etc
  servings:         number
  is_gf:            boolean
  source_image_url: string | null
  created_at:       string
  updated_at:       string
  ingredients?:     Ingredient[]
}

/** A recipe slot in a meal plan. day is 0-6 (0=Monday). */
export interface MealSlot {
  day:       number    // 0=Mon … 6=Sun
  meal_type: MealType
  recipe_id: string
  day_type:  DayType
}

export interface MealPlan {
  id:          string
  user_id:     string
  week_start:  string   // 'YYYY-MM-DD' (Monday)
  slots:       MealSlot[]
  created_at:  string
  updated_at:  string
}

export interface PlannedDayType {
  user_id:  string
  date:     string   // 'YYYY-MM-DD'
  day_type: DayType
}

/** Running macro total alongside a target for progress display */
export interface DisplayMacros {
  targets: MacroSet
  planned: MacroSet
  dayType: DayType
}

/** Deduplicated line item in a shopping list */
export interface ShoppingListItem {
  name:     string
  quantity: number | null
  unit:     string | null
  category: string | null
  is_gf:    boolean
  gf_swap:  string | null
}

export interface DayInstructions {
  date:     string
  day_type: DayType
  meals:    Array<{
    meal_type: MealType
    recipe:    Recipe
  }>
}

/** Columns read from public.user_settings by the recipe app */
export interface UserSettings {
  calorie_target_min: number
  calorie_target_max: number
  protein_target_min: number
  protein_target_max: number
  carb_target_g:      number
  fat_target_g:       number
  tdee:               number | null
  food_restrictions:  string[] | null
  personal_context:   string | null
}

export type RecipeInsert = Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'ingredients'>
export type IngredientInsert = Omit<Ingredient, 'id' | 'created_at'>
