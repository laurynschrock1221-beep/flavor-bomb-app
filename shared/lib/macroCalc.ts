import type { Ingredient, Recipe, MacroSet, UserSettings, UserMacroTargets, DayType } from '../types'

const ZERO: MacroSet = { p: 0, c: 0, f: 0, kcal: 0 }

function addMacros(a: MacroSet, b: MacroSet): MacroSet {
  return { p: a.p + b.p, c: a.c + b.c, f: a.f + b.f, kcal: a.kcal + b.kcal }
}

function scaleMacros(m: MacroSet, factor: number): MacroSet {
  return { p: m.p * factor, c: m.c * factor, f: m.f * factor, kcal: m.kcal * factor }
}

/**
 * Returns macros for a single ingredient, scaling by quantity.
 * LC swaps take priority over GF swaps when both apply.
 */
export function calcIngredientMacros(ingredient: Ingredient, isGF: boolean, isLC = false): MacroSet {
  let base = ingredient.macros
  if (isLC && ingredient.lc_swap && ingredient.lc_swap_macros) {
    base = ingredient.lc_swap_macros
  } else if (isGF && !ingredient.is_gf && ingredient.swap_macros) {
    base = ingredient.swap_macros
  }
  if (!base) return { ...ZERO }
  return scaleMacros(base, ingredient.quantity ?? 1)
}

/**
 * Sums macros for all ingredients in a recipe.
 * Optionally applies GF/LC swaps and/or scales by serving count.
 * NEVER writes to DB — call at render time only.
 */
export function calcRecipeMacros(
  recipe: Recipe,
  { isGF = false, isLC = false }: { isGF?: boolean; isLC?: boolean } = {}
): MacroSet {
  const total = (recipe.ingredients ?? []).reduce(
    (acc, ing) => addMacros(acc, calcIngredientMacros(ing, isGF, isLC)),
    { ...ZERO }
  )
  const perServing = Math.max(1, recipe.servings ?? 1)
  return scaleMacros(total, 1 / perServing)
}

/**
 * Mirrors the existing getTargetsForDayType() logic in the main nutrition tracker.
 * Only carbs and protein/calorie ceiling change with day type.
 */
export function getTargetsForDayType(settings: UserSettings, dayType: DayType): MacroSet {
  switch (dayType) {
    case 'rest':
      return {
        p:    settings.protein_target_min,
        c:    Math.round(settings.carb_target_g * 0.75),
        f:    settings.fat_target_g,
        kcal: settings.calorie_target_min,
      }
    case 'high':
      return {
        p:    settings.protein_target_max,
        c:    Math.round(settings.carb_target_g * 1.3),
        f:    settings.fat_target_g,
        kcal: settings.calorie_target_max,
      }
    case 'moderate':
    default:
      return {
        p:    settings.protein_target_min,
        c:    settings.carb_target_g,
        f:    settings.fat_target_g,
        kcal: settings.calorie_target_min,
      }
  }
}

export function getAllTargets(settings: UserSettings): UserMacroTargets {
  return {
    rest:     getTargetsForDayType(settings, 'rest'),
    moderate: getTargetsForDayType(settings, 'moderate'),
    high:     getTargetsForDayType(settings, 'high'),
  }
}

export function sumMacroSets(sets: MacroSet[]): MacroSet {
  return sets.reduce(addMacros, { ...ZERO })
}

export function macroPercentages(m: MacroSet) {
  const total = m.p * 4 + m.c * 4 + m.f * 9
  if (total === 0) return { protein: 0, carbs: 0, fat: 0 }
  return {
    protein: Math.round((m.p * 4 / total) * 100),
    carbs:   Math.round((m.c * 4 / total) * 100),
    fat:     Math.round((m.f * 9 / total) * 100),
  }
}
