'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSwappableIngredients } from '@flavor-bomb/shared'
import type { Recipe } from '@flavor-bomb/shared'

interface Props {
  recipe: Recipe
  userId: string
}

export default function RecipeDetail({ recipe, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [showGfSwaps, setShowGfSwaps] = useState(false)

  const isOwner = recipe.user_id === userId
  const sortedIngredients = [...(recipe.ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const swappable = getSwappableIngredients(sortedIngredients)
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0)

  async function handleDelete() {
    if (!confirm('Delete this recipe?')) return
    setDeleting(true)
    await supabase.schema('recipes').from('recipes').delete().eq('id', recipe.id)
    router.push('/recipes')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-2xl font-bold">{recipe.name}</h1>
          {isOwner && (
            <div className="flex gap-2 shrink-0">
              <Link href={`/recipes/${recipe.id}/edit`} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        {recipe.description && <p className="text-gray-600">{recipe.description}</p>}

        <div className="flex flex-wrap gap-2 mt-3">
          {recipe.meal_type && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full capitalize">
              {recipe.meal_type}
            </span>
          )}
          {totalTime > 0 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {totalTime} min
            </span>
          )}
          {recipe.servings > 1 && (
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {recipe.servings} servings
            </span>
          )}
          {recipe.gluten_free && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Gluten-free</span>
          )}
          {recipe.dairy_free && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Dairy-free</span>
          )}
        </div>
      </div>

      {/* Macros */}
      {recipe.total_calories != null && (
        <div className="bg-orange-50 rounded-xl p-4 grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Calories', value: recipe.total_calories, unit: 'kcal' },
            { label: 'Protein',  value: recipe.total_protein_g,  unit: 'g' },
            { label: 'Carbs',    value: recipe.total_carbs_g,    unit: 'g' },
            { label: 'Fat',      value: recipe.total_fat_g,      unit: 'g' },
          ].map(m => (
            <div key={m.label}>
              <div className="font-bold text-lg">{Math.round(m.value ?? 0)}</div>
              <div className="text-xs text-gray-500">{m.unit}</div>
              <div className="text-xs text-gray-400">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Ingredients */}
      {sortedIngredients.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Ingredients</h2>
            {swappable.length > 0 && (
              <button
                onClick={() => setShowGfSwaps(v => !v)}
                className="text-xs text-green-700 underline"
              >
                {showGfSwaps ? 'Hide' : 'Show'} GF swaps ({swappable.length})
              </button>
            )}
          </div>
          <ul className="space-y-2">
            {sortedIngredients.map(ing => (
              <li key={ing.id} className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 mt-0.5">•</span>
                <div className="flex-1">
                  <span>
                    {ing.quantity != null && `${ing.quantity} ${ing.unit ?? ''} `.trim() + ' '}
                    <span className={ing.is_optional ? 'text-gray-500 italic' : ''}>{ing.name}</span>
                    {ing.is_optional && <span className="text-gray-400 text-xs ml-1">(optional)</span>}
                  </span>
                  {showGfSwaps && ing.gf_swap && (
                    <div className="text-xs text-green-700 mt-0.5">→ {ing.gf_swap}</div>
                  )}
                </div>
                {ing.calories > 0 && (
                  <span className="text-xs text-gray-400 shrink-0">{Math.round(ing.calories)} kcal</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      {recipe.instructions.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Instructions</h2>
          <ol className="space-y-3">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="shrink-0 w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <p className="text-gray-700 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <Link href="/recipes" className="inline-block text-sm text-gray-500 hover:text-gray-700">
        ← Back to recipes
      </Link>
    </div>
  )
}
