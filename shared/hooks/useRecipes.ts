'use client'
import { useState, useEffect, useCallback } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Recipe, RecipeInsert, Ingredient, IngredientInsert } from '../types'
import { recipesDb } from '../lib/supabaseClient'

interface UseRecipesOptions {
  mealType?: string
  cuisine?:  string
  gfOnly?:   boolean
  search?:   string
}

export function useRecipes(supabase: SupabaseClient, options: UseRecipesOptions = {}) {
  const [recipes, setRecipes]   = useState<Recipe[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = recipesDb(supabase)
      .from('recipes')
      .select('*, ingredients(*)')
      .order('created_at', { ascending: false })

    if (options.mealType) query = query.eq('meal_type', options.mealType)
    if (options.cuisine)  query = query.eq('cuisine',   options.cuisine)
    if (options.gfOnly)   query = query.eq('is_gf',     true)
    if (options.search)   query = query.ilike('name', `%${options.search}%`)

    const { data, error: err } = await query
    if (err) setError(err.message)
    else     setRecipes((data as Recipe[]) || [])
    setLoading(false)
  }, [supabase, options.mealType, options.cuisine, options.gfOnly, options.search])

  useEffect(() => { refresh() }, [refresh])

  const createRecipe = useCallback(async (
    recipe:      RecipeInsert,
    ingredients: IngredientInsert[] = []
  ): Promise<Recipe> => {
    const { data: row, error: err } = await recipesDb(supabase)
      .from('recipes')
      .insert(recipe)
      .select()
      .single()
    if (err) throw err

    const id = (row as Recipe).id
    if (ingredients.length > 0) {
      const rows = ingredients.map((ing, i) => ({ ...ing, recipe_id: id, sort_order: i }))
      const { error: ingErr } = await recipesDb(supabase).from('ingredients').insert(rows)
      if (ingErr) throw ingErr
    }

    const { data: full } = await recipesDb(supabase)
      .from('recipes').select('*, ingredients(*)').eq('id', id).single()
    const result = full as Recipe
    setRecipes(prev => [result, ...prev])
    return result
  }, [supabase])

  const updateRecipe = useCallback(async (id: string, updates: Partial<RecipeInsert>): Promise<Recipe> => {
    const { data, error: err } = await recipesDb(supabase)
      .from('recipes').update(updates).eq('id', id).select('*, ingredients(*)').single()
    if (err) throw err
    const result = data as Recipe
    setRecipes(prev => prev.map(r => r.id === id ? result : r))
    return result
  }, [supabase])

  const deleteRecipe = useCallback(async (id: string) => {
    const { error: err } = await recipesDb(supabase).from('recipes').delete().eq('id', id)
    if (err) throw err
    setRecipes(prev => prev.filter(r => r.id !== id))
  }, [supabase])

  const upsertIngredients = useCallback(async (recipeId: string, ingredients: IngredientInsert[]) => {
    await recipesDb(supabase).from('ingredients').delete().eq('recipe_id', recipeId)
    if (ingredients.length > 0) {
      const rows = ingredients.map((ing, i) => ({ ...ing, recipe_id: recipeId, sort_order: i }))
      const { error: err } = await recipesDb(supabase).from('ingredients').insert(rows)
      if (err) throw err
    }
    const { data } = await recipesDb(supabase)
      .from('recipes').select('*, ingredients(*)').eq('id', recipeId).single()
    const result = data as Recipe
    setRecipes(prev => prev.map(r => r.id === recipeId ? result : r))
    return result
  }, [supabase])

  // Convenience filters (client-side, applied to loaded recipes)
  const filterByMealType = useCallback((type: string) =>
    recipes.filter(r => r.meal_type === type), [recipes])

  const filterByCuisine = useCallback((cuisine: string) =>
    recipes.filter(r => r.cuisine === cuisine), [recipes])

  const filterGF = useCallback(() =>
    recipes.filter(r => r.is_gf), [recipes])

  return {
    recipes, loading, error, refresh,
    createRecipe, updateRecipe, deleteRecipe, upsertIngredients,
    filterByMealType, filterByCuisine, filterGF,
  }
}

export function useRecipe(supabase: SupabaseClient, id: string) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    recipesDb(supabase)
      .from('recipes').select('*, ingredients(*)').eq('id', id).single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message)
        else setRecipe(data as Recipe)
        setLoading(false)
      })
  }, [supabase, id])

  return { recipe, loading, error }
}
