'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import RecipeCard from './RecipeCard'
import DayTypeToggle from './DayTypeToggle'
import { createClient } from '@/lib/supabase/client'
import type { Recipe, DayType, MealType, UserSettings } from '@flavor-bomb/shared'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'side'] as const
const CUISINES   = ['Korean', 'Mexican', 'Japanese', 'Asian', 'Mediterranean', 'Other'] as const

interface Props {
  initialRecipes: Recipe[]
  userSettings?:  UserSettings | null
}

export default function RecipeList({ initialRecipes, userSettings }: Props) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const supabase = createClient()
  const [dayType, setDayType] = useState<DayType>('moderate')
  const [isGF, setIsGF]       = useState(true)
  const [isLC, setIsLC]       = useState(false)
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)

  async function handleMealTypeChange(recipeId: string, mealType: MealType) {
    setRecipes(prev => prev.map(r => {
      if (r.id !== recipeId) return r
      const current = r.meal_type ?? []
      const next = current.includes(mealType)
        ? current.filter(t => t !== mealType)
        : [...current, mealType]
      return { ...r, meal_type: next }
    }))
    const updated = recipes.find(r => r.id === recipeId)
    const current = updated?.meal_type ?? []
    const next = current.includes(mealType) ? current.filter(t => t !== mealType) : [...current, mealType]
    await supabase.schema('recipes').from('recipes').update({ meal_type: next }).eq('id', recipeId)
  }

  const activeMeal    = searchParams.get('meal')    ?? ''
  const activeCuisine = searchParams.get('cuisine') ?? ''
  const activeGF      = searchParams.get('gf')      === 'true'

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const filtered = recipes.filter(r => {
    if (activeMeal    && !(r.meal_type ?? []).includes(activeMeal as MealType)) return false
    if (activeCuisine && r.cuisine !== activeCuisine) return false
    if (activeGF      && !r.is_gf)                   return false
    return true
  })

  const chipStyle = (active: boolean, accentColor?: string) => ({
    padding: '6px 14px',
    borderRadius: 99,
    border: `1.5px solid ${active ? (accentColor ?? '#C1440E') : '#e5e0d8'}`,
    background: active ? (accentColor ?? '#C1440E') : '#fff',
    color: active ? '#fff' : '#666',
    fontSize: 13,
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'all 0.15s',
  })

  return (
    <div>
      {/* Day type + GF row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <DayTypeToggle value={dayType} onChange={setDayType} />
        <button onClick={() => setIsGF(v => !v)} style={chipStyle(isGF, '#2C6E49')}>
          🌿 GF mode
        </button>
        <button onClick={() => setIsLC(v => !v)} style={chipStyle(isLC, '#8B5E3C')}>
          🥦 Low Carb
        </button>
      </div>

      {/* Meal type chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 2 }}>
        <button style={chipStyle(!activeMeal)} onClick={() => updateParams({ meal: null })}>All</button>
        {MEAL_TYPES.map(t => (
          <button key={t} style={chipStyle(activeMeal === t)} onClick={() => updateParams({ meal: activeMeal === t ? null : t })}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Cuisine chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
        <button style={chipStyle(!activeCuisine)} onClick={() => updateParams({ cuisine: null })}>All Cuisines</button>
        {CUISINES.map(c => (
          <button key={c} style={chipStyle(activeCuisine === c)} onClick={() => updateParams({ cuisine: activeCuisine === c ? null : c })}>
            {c}
          </button>
        ))}
        <button style={chipStyle(activeGF, '#2C6E49')} onClick={() => updateParams({ gf: activeGF ? null : 'true' })}>
          GF Only
        </button>
      </div>

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#aaa', padding: '48px 0' }}>No recipes match.</p>
      ) : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {filtered.map(r => (
            <RecipeCard
              key={r.id}
              recipe={r}
              dayType={dayType}
              isGF={isGF}
              isLC={isLC}
              userSettings={userSettings}
              onMealTypeChange={(mt) => handleMealTypeChange(r.id, mt)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
