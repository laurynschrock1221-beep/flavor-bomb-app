// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Recipe, RecipeInsert, IngredientInsert, MealType } from '@flavor-bomb/shared'

interface IngredientRow extends IngredientInsert {
  _key: string
}

interface Props {
  initialRecipe?: Recipe
}

function makeKey() { return Math.random().toString(36).slice(2) }

const emptyIngredient = (): IngredientRow => ({
  _key: makeKey(),
  recipe_id: '',
  name: '',
  quantity: null,
  unit: null,
  calories: 0,
  protein_g: 0,
  carbs_g: 0,
  fat_g: 0,
  is_optional: false,
  gf_swap: null,
  sort_order: 0,
})

export default function RecipeFormPage({ initialRecipe }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState(initialRecipe?.name ?? '')
  const [description, setDescription] = useState(initialRecipe?.description ?? '')
  const [mealType, setMealType] = useState<MealType | ''>(initialRecipe?.meal_type ?? '')
  const [servings, setServings] = useState(initialRecipe?.servings ?? 1)
  const [prepTime, setPrepTime] = useState(initialRecipe?.prep_time_minutes ?? '')
  const [cookTime, setCookTime] = useState(initialRecipe?.cook_time_minutes ?? '')
  const [instructions, setInstructions] = useState<string[]>(
    initialRecipe?.instructions.length ? initialRecipe.instructions : ['']
  )
  const [isPublic, setIsPublic] = useState(initialRecipe?.is_public ?? false)
  const [glutenFree, setGlutenFree] = useState(initialRecipe?.gluten_free ?? false)
  const [dairyFree, setDairyFree] = useState(initialRecipe?.dairy_free ?? false)
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialRecipe?.ingredients?.length
      ? initialRecipe.ingredients.map(i => ({ ...i, _key: i.id }))
      : [emptyIngredient()]
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateIngredient(key: string, field: keyof IngredientRow, value: unknown) {
    setIngredients(prev => prev.map(ing => {
      if (ing._key !== key) return ing
      const updated = { ...ing, [field]: value }
      if (field === 'name') updated.gf_swap = null
      return updated
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const recipePayload: RecipeInsert = {
        name,
        description: description || null,
        meal_type: mealType || null,
        servings,
        prep_time_minutes: prepTime ? Number(prepTime) : null,
        cook_time_minutes: cookTime ? Number(cookTime) : null,
        instructions: instructions.filter(Boolean),
        tags: [],
        is_public: isPublic,
        gluten_free: glutenFree,
        dairy_free: dairyFree,
        image_url: null,
      }

      const validIngredients = ingredients
        .filter(i => i.name.trim())
        .map(({ _key: _k, recipe_id: _r, ...ing }) => ing)

      if (initialRecipe?.id) {
        // Update
        const { error: updateErr } = await supabase
          .schema('recipes')
          .from('recipes')
          .update(recipePayload)
          .eq('id', initialRecipe.id)

        if (updateErr) throw updateErr

        // Replace ingredients
        await (supabase as any).schema('recipes').from('ingredients').delete().eq('recipe_id', initialRecipe.id)
        if (validIngredients.length > 0) {
          const rows = validIngredients.map((ing, i) => ({ ...ing, recipe_id: initialRecipe.id, sort_order: i }))
          const { error: ingErr } = await (supabase as any).schema('recipes').from('ingredients').insert(rows)
          if (ingErr) throw ingErr
        }

        router.push(`/recipes/${initialRecipe.id}`)
      } else {
        // Create
        const { data: newRecipe, error: createErr } = await supabase
          .schema('recipes')
          .from('recipes')
          .insert(recipePayload)
          .select()
          .single()

        if (createErr) throw createErr

        if (validIngredients.length > 0) {
          const rows = validIngredients.map((ing, i) => ({
            ...ing,
            recipe_id: (newRecipe as Recipe).id,
            sort_order: i,
          }))
          const { error: ingErr } = await (supabase as any).schema('recipes').from('ingredients').insert(rows)
          if (ingErr) throw ingErr
        }

        router.push(`/recipes/${(newRecipe as Recipe).id}`)
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save recipe')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Meal type</label>
            <select
              value={mealType}
              onChange={e => setMealType(e.target.value as MealType | '')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any</option>
              {(['breakfast','lunch','dinner','snack'] as MealType[]).map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Servings</label>
            <input
              type="number" min={1} value={servings}
              onChange={e => setServings(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Prep min</label>
              <input
                type="number" min={0} value={prepTime}
                onChange={e => setPrepTime(e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cook min</label>
              <input
                type="number" min={0} value={cookTime}
                onChange={e => setCookTime(e.target.value)}
                placeholder="—"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {[
            { label: 'Gluten-free', state: glutenFree, set: setGlutenFree },
            { label: 'Dairy-free',  state: dairyFree,  set: setDairyFree  },
            { label: 'Public',      state: isPublic,   set: setIsPublic   },
          ].map(({ label, state, set }) => (
            <label key={label} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={state} onChange={e => set(e.target.checked)}
                className="rounded text-brand-500 focus:ring-brand-500" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Ingredients</h2>
          <button type="button" onClick={() => setIngredients(p => [...p, emptyIngredient()])}
            className="text-sm text-brand-500 hover:text-brand-600">
            + Add
          </button>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing, idx) => (
            <div key={ing._key} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={e => updateIngredient(ing._key, 'name', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  placeholder="Qty"
                  type="number" min={0} step="any"
                  value={ing.quantity ?? ''}
                  onChange={e => updateIngredient(ing._key, 'quantity', e.target.value ? Number(e.target.value) : null)}
                  className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <input
                  placeholder="unit"
                  value={ing.unit ?? ''}
                  onChange={e => updateIngredient(ing._key, 'unit', e.target.value || null)}
                  className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button type="button"
                  onClick={() => setIngredients(p => p.filter(i => i._key !== ing._key))}
                  className="text-gray-400 hover:text-red-500 px-1 text-lg leading-none">
                  ×
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(['calories', 'protein_g', 'carbs_g', 'fat_g'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-xs text-gray-400 mb-0.5">{field.replace('_g','')}</label>
                    <input
                      type="number" min={0} step="any"
                      value={(ing[field] as number) || ''}
                      onChange={e => updateIngredient(ing._key, field, e.target.value ? Number(e.target.value) : 0)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                ))}
              </div>

              {ing.gf_swap && (
                <p className="text-xs text-green-700">GF swap: {ing.gf_swap}</p>
              )}

              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input type="checkbox" checked={ing.is_optional}
                  onChange={e => updateIngredient(ing._key, 'is_optional', e.target.checked)} />
                Optional
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Instructions</h2>
          <button type="button" onClick={() => setInstructions(p => [...p, ''])}
            className="text-sm text-brand-500 hover:text-brand-600">
            + Step
          </button>
        </div>
        <div className="space-y-2">
          {instructions.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold mt-2">
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={e => setInstructions(p => p.map((s, j) => j === i ? e.target.value : s))}
                rows={2}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button type="button"
                onClick={() => setInstructions(p => p.filter((_, j) => j !== i))}
                className="text-gray-400 hover:text-red-500 mt-2 text-lg leading-none">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-brand-500 text-white py-2.5 rounded-lg hover:bg-brand-600 disabled:opacity-50 font-medium transition-colors"
        >
          {saving ? 'Saving…' : initialRecipe ? 'Save changes' : 'Create recipe'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </form>
  )
}
