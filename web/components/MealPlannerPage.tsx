'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useMealPlan, getWeekStart, getTargetsForDayType, calcRecipeMacros } from '@flavor-bomb/shared'
import DayTypeToggle from './DayTypeToggle'
import type { Recipe, MealType, MealSlot, UserSettings } from '@flavor-bomb/shared'

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

interface Props {
  recipes: Recipe[]
  userSettings: UserSettings | null
}

export default function MealPlannerPage({ recipes, userSettings }: Props) {
  const supabase = createClient()
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [selectedCell, setSelectedCell] = useState<{ day: string; mealType: MealType } | null>(null)
  const [recipeSearch, setRecipeSearch] = useState('')

  const { plan, loading, addRecipeToSlot, removeRecipeFromSlot, setDayType, getDayType } =
    useMealPlan(supabase, weekStart)

  function prevWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d.toISOString().split('T')[0])
  }

  function nextWeek() {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d.toISOString().split('T')[0])
  }

  function getDateForDay(day: string): string {
    const idx = DAYS.indexOf(day)
    const d = new Date(weekStart)
    d.setDate(d.getDate() + idx)
    return d.toISOString().split('T')[0]
  }

  function getSlotsForCell(day: string, mealType: MealType): MealSlot[] {
    const idx = DAYS.indexOf(day)
    return (plan?.slots ?? []).filter(s => s.day === idx && s.meal_type === mealType)
  }

  function getRecipeById(id: string): Recipe | undefined {
    return recipes.find(r => r.id === id)
  }

  async function pickRecipe(recipe: Recipe) {
    if (!selectedCell) return
    const { day, mealType } = selectedCell
    const dayIdx = DAYS.indexOf(day)
    const dayType = getDayType(getDateForDay(day))
    await addRecipeToSlot(dayIdx, mealType, recipe.id, dayType)
    setSelectedCell(null)
    setRecipeSearch('')
  }

  function getDayMacros(day: string) {
    const idx = DAYS.indexOf(day)
    const slots = (plan?.slots ?? []).filter(s => s.day === idx)
    return slots.reduce(
      (acc, s) => {
        const r = getRecipeById(s.recipe_id)
        if (!r) return acc
        const m = calcRecipeMacros(r)
        return { p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f, kcal: acc.kcal + m.kcal }
      },
      { p: 0, c: 0, f: 0, kcal: 0 }
    )
  }

  const filteredRecipes = recipes.filter(r =>
    !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  )

  if (loading) {
    return <div className="text-center text-gray-400 py-12">Loading planner…</div>
  }

  return (
    <div className="space-y-6">
      {/* Week nav */}
      <div className="flex items-center gap-4">
        <button onClick={prevWeek} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          ← Prev
        </button>
        <span className="font-medium text-sm">
          Week of {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <button onClick={nextWeek} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
          Next →
        </button>
      </div>

      {/* Planner grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 font-medium text-gray-500 w-24"></th>
              {DAYS.map(day => {
                const date = getDateForDay(day)
                const dayType = getDayType(date)
                return (
                  <th key={day} className="p-2 text-center min-w-[120px]">
                    <div className="font-medium capitalize">{day.slice(0,3)}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="mt-1">
                      <DayTypeToggle
                        value={dayType}
                        onChange={dt => setDayType(date, dt)}
                      />
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map(mealType => (
              <tr key={mealType} className="border-t border-gray-100">
                <td className="p-2 font-medium text-gray-500 capitalize align-top">{mealType}</td>
                {DAYS.map(day => {
                  const slots = getSlotsForCell(day, mealType)
                  const isActive = selectedCell?.day === day && selectedCell?.mealType === mealType
                  return (
                    <td key={day} className="p-1 align-top">
                      <div
                        className={`min-h-[60px] rounded-lg border-2 p-1 cursor-pointer transition-colors ${
                          isActive
                            ? 'border-brand-500 bg-orange-50'
                            : 'border-dashed border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCell(isActive ? null : { day, mealType })}
                      >
                        {slots.map((slot, i) => {
                          const r = getRecipeById(slot.recipe_id)
                          return r ? (
                            <div key={i} className="text-xs bg-white border border-gray-200 rounded p-1 mb-1 flex items-center gap-1">
                              <span className="flex-1 truncate">{r.name}</span>
                              <button
                                onClick={e => { e.stopPropagation(); removeRecipeFromSlot(DAYS.indexOf(day), mealType) }}
                                className="text-gray-400 hover:text-red-500 shrink-0"
                              >
                                ×
                              </button>
                            </div>
                          ) : null
                        })}
                        {slots.length === 0 && (
                          <div className="text-xs text-gray-300 text-center mt-2">+</div>
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
            {/* Day macro totals row */}
            {userSettings && (
              <tr className="border-t border-gray-200">
                <td className="p-2 text-xs text-gray-400">Totals</td>
                {DAYS.map(day => {
                  const date = getDateForDay(day)
                  const dayType = getDayType(date)
                  const targets = getTargetsForDayType(userSettings, dayType)
                  const planned = getDayMacros(day)
                  const pct = targets.kcal > 0
                    ? Math.min(100, Math.round((planned.kcal / targets.kcal) * 100))
                    : 0
                  return (
                    <td key={day} className="p-1 text-center">
                      <div className="text-xs font-medium">{Math.round(planned.kcal)} kcal</div>
                      <div className="text-xs text-gray-400">/{targets.kcal}</div>
                      <div className="h-1 bg-gray-100 rounded mt-1">
                        <div
                          className={`h-full rounded transition-all ${pct > 100 ? 'bg-red-400' : 'bg-brand-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recipe picker panel */}
      {selectedCell && (
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">
              Pick recipe for {selectedCell.day} {selectedCell.mealType}
            </h3>
            <button onClick={() => setSelectedCell(null)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          <input
            type="search"
            placeholder="Search…"
            value={recipeSearch}
            onChange={e => setRecipeSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto">
            {filteredRecipes.map(r => {
              const m = calcRecipeMacros(r)
              return (
                <button
                  key={r.id}
                  onClick={() => pickRecipe(r)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-brand-500 transition-colors"
                >
                  <div className="font-medium text-sm">{r.name}</div>
                  {m.kcal > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {Math.round(m.kcal)} kcal · {Math.round(m.p)}g P
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
