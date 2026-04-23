'use client'
import { useState, useEffect, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MealPlan, MealSlot, PlannedDayType, DayType, MealType, Recipe, ShoppingListItem, DayInstructions } from '../types'
import { recipesDb } from '../lib/supabaseClient'

/** Returns the ISO date string for Monday of the week containing `date`. */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

/** Returns 'YYYY-MM-DD' for weekStart + dayIndex (0=Mon). */
export function slotDate(weekStart: string, dayIndex: number): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + dayIndex)
  return d.toISOString().split('T')[0]
}

export function useMealPlan(supabase: SupabaseClient, weekStart: string) {
  const [plan, setPlan]                     = useState<MealPlan | null>(null)
  const [plannedDayTypes, setPlannedDayTypes] = useState<PlannedDayType[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!weekStart) return
    setLoading(true)
    setError(null)

    const weekEnd = slotDate(weekStart, 6)

    const [planRes, dtRes] = await Promise.all([
      recipesDb(supabase)
        .from('meal_plans').select('*').eq('week_start', weekStart).maybeSingle(),
      recipesDb(supabase)
        .from('planned_day_types').select('*').gte('date', weekStart).lte('date', weekEnd),
    ])

    if (planRes.error) setError(planRes.error.message)
    else setPlan(planRes.data as MealPlan | null)

    if (!dtRes.error) setPlannedDayTypes((dtRes.data as PlannedDayType[]) || [])
    setLoading(false)
  }, [supabase, weekStart])

  useEffect(() => { refresh() }, [refresh])

  const _saveSlots = useCallback(async (slots: MealSlot[]) => {
    if (plan?.id) {
      const { data, error: err } = await recipesDb(supabase)
        .from('meal_plans').update({ slots }).eq('id', plan.id).select().single()
      if (err) throw err
      setPlan(data as MealPlan)
      return data as MealPlan
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { data, error: err } = await recipesDb(supabase)
        .from('meal_plans').insert({ week_start: weekStart, slots, user_id: user.id }).select().single()
      if (err) throw err
      setPlan(data as MealPlan)
      return data as MealPlan
    }
  }, [supabase, weekStart, plan?.id])

  const addRecipeToSlot = useCallback(async (
    day: number, mealType: MealType, recipeId: string, dayType: DayType
  ) => {
    const current = plan?.slots ?? []
    const filtered = current.filter(s => !(s.day === day && s.meal_type === mealType))
    return _saveSlots([...filtered, { day, meal_type: mealType, recipe_id: recipeId, day_type: dayType }])
  }, [plan?.slots, _saveSlots])

  const removeRecipeFromSlot = useCallback(async (day: number, mealType: MealType) => {
    const current = plan?.slots ?? []
    return _saveSlots(current.filter(s => !(s.day === day && s.meal_type === mealType)))
  }, [plan?.slots, _saveSlots])

  const setDayType = useCallback(async (date: string, dayType: DayType) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error: err } = await recipesDb(supabase)
      .from('planned_day_types')
      .upsert({ user_id: user.id, date, day_type: dayType }, { onConflict: 'user_id,date' })
      .select().single()
    if (err) throw err
    const updated = data as PlannedDayType
    setPlannedDayTypes(prev => [...prev.filter(d => d.date !== date), updated])
  }, [supabase])

  const getDayType = useCallback((date: string): DayType =>
    plannedDayTypes.find(d => d.date === date)?.day_type ?? 'moderate',
  [plannedDayTypes])

  /** Deduplicated, category-grouped shopping list. isGF applies GF swaps. */
  const generateShoppingList = useCallback((isGF: boolean, recipes: Recipe[]): ShoppingListItem[] => {
    if (!plan) return []

    const recipeMap = new Map(recipes.map(r => [r.id, r]))
    const acc = new Map<string, ShoppingListItem>()

    for (const slot of plan.slots) {
      const recipe = recipeMap.get(slot.recipe_id)
      if (!recipe?.ingredients) continue
      for (const ing of recipe.ingredients) {
        const displayName = isGF && !ing.is_gf && ing.gf_swap ? ing.gf_swap : ing.name
        const key = `${displayName.toLowerCase()}::${ing.unit ?? ''}`
        const existing = acc.get(key)
        if (existing) {
          existing.quantity = existing.quantity != null && ing.quantity != null
            ? existing.quantity + ing.quantity
            : existing.quantity ?? ing.quantity
        } else {
          acc.set(key, {
            name:     displayName,
            quantity: ing.quantity,
            unit:     ing.unit,
            category: ing.category,
            is_gf:    isGF ? true : ing.is_gf,
            gf_swap:  ing.gf_swap,
          })
        }
      }
    }

    const CATEGORY_ORDER = ['Proteins','Produce','Dairy','Grains & Frozen','Pantry']
    return [...acc.values()].sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.category ?? '')
      const bi = CATEGORY_ORDER.indexOf(b.category ?? '')
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
    })
  }, [plan])

  /** Per-day ordered meal instructions for the week. */
  const generateInstructions = useCallback((recipes: Recipe[]): DayInstructions[] => {
    if (!plan) return []
    const recipeMap = new Map(recipes.map(r => [r.id, r]))
    const DAYS = 7
    const result: DayInstructions[] = []

    for (let i = 0; i < DAYS; i++) {
      const date = slotDate(weekStart, i)
      const daySlots = plan.slots
        .filter(s => s.day === i)
        .sort((a, b) => (['breakfast','lunch','dinner'] as MealType[]).indexOf(a.meal_type) -
                        (['breakfast','lunch','dinner'] as MealType[]).indexOf(b.meal_type))
      if (daySlots.length === 0) continue
      const meals = daySlots
        .map(s => ({ meal_type: s.meal_type, recipe: recipeMap.get(s.recipe_id) }))
        .filter((m): m is { meal_type: MealType; recipe: Recipe } => m.recipe !== undefined)
      if (meals.length === 0) continue
      result.push({ date, day_type: getDayType(date), meals })
    }
    return result
  }, [plan, weekStart, getDayType])

  return {
    plan, plannedDayTypes, loading, error, refresh,
    addRecipeToSlot, removeRecipeFromSlot, setDayType, getDayType,
    generateShoppingList, generateInstructions,
  }
}
