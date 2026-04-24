'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { createClient } from '@/lib/supabase/client'
import {
  useMealPlan, getWeekStart, slotDate, getTargetsForDayType, calcRecipeMacros,
} from '@flavor-bomb/shared'
import type { Recipe, DayType, MealType, UserSettings } from '@flavor-bomb/shared'
import DayColumn          from './DayColumn'
import RecipeSidebar      from './RecipeSidebar'
import ShoppingListOutput from './ShoppingListOutput'
import InstructionsOutput from './InstructionsOutput'
import DayTypeToggle      from '../DayTypeToggle'

type Tab = 'planner' | 'shopping' | 'instructions'

const DAY_LABELS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']

interface Props {
  recipes:      Recipe[]
  userSettings: UserSettings | null
}

export default function PlannerGrid({ recipes, userSettings }: Props) {
  const supabase  = createClient()
  const [weekStart, setWeekStart]         = useState(getWeekStart())
  const [activeTab, setActiveTab]         = useState<Tab>('planner')
  const [isGF, setIsGF]                   = useState(false)
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null)
  const [isMobile, setIsMobile]           = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    // Default to today's index within the current week (0=Mon … 6=Sun)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const ws    = new Date(getWeekStart()); ws.setHours(0, 0, 0, 0)
    const diff  = Math.round((today.getTime() - ws.getTime()) / 86_400_000)
    return diff >= 0 && diff <= 6 ? diff : 0
  })
  const [pickerSlot, setPickerSlot]       = useState<{ day: number; mealType: MealType } | null>(null)
  const [pickerSearch, setPickerSearch]   = useState('')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const {
    plan, loading,
    addRecipeToSlot, removeRecipeFromSlot,
    setDayType, getDayType,
    generateShoppingList, generateInstructions,
  } = useMealPlan(supabase, weekStart)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  function prevWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() - 7)
    setWeekStart(d.toISOString().split('T')[0])
  }
  function nextWeek() {
    const d = new Date(weekStart); d.setDate(d.getDate() + 7)
    setWeekStart(d.toISOString().split('T')[0])
  }

  function handleDragStart(event: { active: { data: { current?: { recipeId?: string } } } }) {
    const id = event.active.data.current?.recipeId
    if (id) setDraggedRecipe(recipes.find(r => r.id === id) ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggedRecipe(null)
    const { active, over } = event
    if (!over) return
    const recipeId = (active.data.current as { recipeId?: string })?.recipeId
    if (!recipeId) return
    const parts = String(over.id).split('-')
    if (parts[0] !== 'day' || parts.length !== 3) return
    const dayIndex = parseInt(parts[1])
    const mealType = parts[2] as MealType
    const date     = slotDate(weekStart, dayIndex)
    await addRecipeToSlot(dayIndex, mealType, recipeId, getDayType(date) as DayType)
  }

  async function handleMobilePick(recipe: Recipe) {
    if (!pickerSlot) return
    const date = slotDate(weekStart, pickerSlot.day)
    await addRecipeToSlot(pickerSlot.day, pickerSlot.mealType, recipe.id, getDayType(date) as DayType)
    setPickerSlot(null)
    setPickerSearch('')
  }

  const tabStyle = (tab: Tab, compact = false) => ({
    padding: compact ? '6px 12px' : '8px 18px',
    borderRadius: 8, cursor: 'pointer',
    fontSize: compact ? 12 : 13, fontWeight: 600 as const,
    border: 'none',
    background: activeTab === tab ? '#C1440E' : 'transparent',
    color: activeTab === tab ? '#fff' : '#888',
    transition: 'all 0.15s',
  })

  // ─── MOBILE LAYOUT ────────────────────────────────────────────────────────
  if (isMobile) {
    const date      = slotDate(weekStart, selectedDayIndex)
    const dayType   = getDayType(date)
    const targets   = userSettings ? getTargetsForDayType(userSettings, dayType) : { p: 0, c: 0, f: 0, kcal: 0 }
    const recipeMap = new Map(recipes.map(r => [r.id, r]))
    const daySlots  = (plan?.slots ?? []).filter(s => s.day === selectedDayIndex)

    const totalMacros = daySlots.reduce((acc, slot) => {
      const r = recipeMap.get(slot.recipe_id)
      if (!r) return acc
      const m = calcRecipeMacros(r)
      return { p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f, kcal: acc.kcal + m.kcal }
    }, { p: 0, c: 0, f: 0, kcal: 0 })

    const calPct   = targets.kcal > 0 ? Math.min(100, Math.round((totalMacros.kcal / targets.kcal) * 100)) : 0
    const barColor = calPct > 110 ? '#C1440E' : calPct > 85 ? '#2C6E49' : '#8B5E3C'

    const filteredRecipes = recipes.filter(r =>
      !pickerSearch || r.name.toLowerCase().includes(pickerSearch.toLowerCase())
    )

    return (
      <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
        {/* Week nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <button onClick={prevWeek} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ede8e0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>←</button>
          <span style={{ fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'center', color: '#444' }}>
            {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(slotDate(weekStart, 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={nextWeek} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ede8e0', background: '#fff', cursor: 'pointer', fontSize: 14 }}>→</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f0e8de', borderRadius: 10, padding: 3, gap: 2, marginBottom: 14 }}>
          {(['planner', 'shopping', 'instructions'] as Tab[]).map(t => (
            <button key={t} style={tabStyle(t, true)} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'shopping' && <ShoppingListOutput items={generateShoppingList(isGF, recipes)} isGF={isGF} />}
        {activeTab === 'instructions' && <InstructionsOutput days={generateInstructions(recipes)} />}

        {activeTab === 'planner' && (
          <>
            {/* Day strip */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
              {Array.from({ length: 7 }, (_, i) => {
                const d        = slotDate(weekStart, i)
                const hasSlots = (plan?.slots ?? []).some(s => s.day === i)
                const sel      = selectedDayIndex === i
                // Is this calendar day == today?
                const today    = new Date(); today.setHours(0,0,0,0)
                const dayDate  = new Date(d); dayDate.setHours(0,0,0,0)
                const isToday  = dayDate.getTime() === today.getTime()
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDayIndex(i); setPickerSlot(null) }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      padding: '8px 10px', borderRadius: 12, cursor: 'pointer', flexShrink: 0,
                      border: `2px solid ${sel ? '#C1440E' : isToday ? '#f59e0b' : '#ede8e0'}`,
                      background: sel ? '#C1440E' : '#fff',
                      color: sel ? '#fff' : '#666',
                      minWidth: 44,
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{DAY_LABELS[i]}</span>
                    <span style={{ fontSize: 10, opacity: 0.8 }}>
                      {new Date(d).toLocaleDateString('en-US', { day: 'numeric' })}
                    </span>
                    {hasSlots && (
                      <span style={{
                        width: 4, height: 4, borderRadius: '50%', marginTop: 3,
                        background: sel ? 'rgba(255,255,255,0.7)' : '#C1440E',
                      }} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Day header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>
                  {DAY_LABELS[selectedDayIndex]}
                </div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <DayTypeToggle value={dayType} onChange={dt => setDayType(date, dt)} />
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading plan…</div>
            ) : (
              <>
                {MEAL_TYPES.map(mealType => {
                  const slot        = daySlots.find(s => s.meal_type === mealType)
                  const recipe      = slot ? recipeMap.get(slot.recipe_id) : undefined
                  const isOpen      = pickerSlot?.day === selectedDayIndex && pickerSlot?.mealType === mealType

                  return (
                    <div key={mealType} style={{ marginBottom: 12 }}>
                      <div
                        onClick={() => {
                          setPickerSlot(isOpen ? null : { day: selectedDayIndex, mealType })
                          setPickerSearch('')
                        }}
                        style={{
                          minHeight: 68, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s',
                          border: `2px ${isOpen ? 'solid #C1440E' : 'dashed #e5e0d8'}`,
                          background: isOpen ? '#fff3ef' : recipe ? '#fff' : '#fdf6ec',
                          padding: '10px 14px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>
                          {mealType}
                        </div>
                        {recipe ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{recipe.emoji ?? '🍽️'}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {recipe.name}
                              </div>
                              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                                {Math.round(calcRecipeMacros(recipe).kcal)} kcal · {Math.round(calcRecipeMacros(recipe).p)}g P
                              </div>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); removeRecipeFromSlot(selectedDayIndex, mealType) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 22, padding: '0 4px', lineHeight: 1 }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#ccc', textAlign: 'center', paddingTop: 2 }}>
                            {isOpen ? 'Choose below ↓' : '+ Tap to add'}
                          </div>
                        )}
                      </div>

                      {/* Inline recipe picker */}
                      {isOpen && (
                        <div style={{ marginTop: 8, borderRadius: 12, border: '1.5px solid #ede8e0', background: '#fff', padding: 12 }}>
                          <input
                            autoFocus
                            type="search"
                            placeholder="Search recipes…"
                            value={pickerSearch}
                            onChange={e => setPickerSearch(e.target.value)}
                            style={{
                              width: '100%', border: '1.5px solid #ede8e0', borderRadius: 8,
                              padding: '8px 12px', fontSize: 13, marginBottom: 10,
                              background: '#fdf6ec', outline: 'none', boxSizing: 'border-box',
                            }}
                          />
                          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {filteredRecipes.map(r => {
                              const m = calcRecipeMacros(r)
                              return (
                                <button
                                  key={r.id}
                                  onClick={() => handleMobilePick(r)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', borderRadius: 10,
                                    border: '1.5px solid #ede8e0', background: '#fff',
                                    cursor: 'pointer', textAlign: 'left',
                                  }}
                                >
                                  <span style={{ fontSize: 22, flexShrink: 0 }}>{r.emoji ?? '🍽️'}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {r.name}
                                    </div>
                                    {m.kcal > 0 && (
                                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                                        {Math.round(m.kcal)} kcal · {Math.round(m.p)}g P · {Math.round(m.c)}g C
                                      </div>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                            {filteredRecipes.length === 0 && (
                              <div style={{ textAlign: 'center', color: '#ccc', padding: '20px 0', fontSize: 13 }}>
                                No recipes found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Day macro totals */}
                <div style={{ marginTop: 4, paddingTop: 14, borderTop: '1.5px solid #f0ebe3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600 }}>{Math.round(totalMacros.kcal)} kcal</span>
                    <span>target: {Math.round(targets.kcal)} kcal</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                    <span>{Math.round(totalMacros.p)}g P</span>
                    <span>{Math.round(totalMacros.c)}g C</span>
                    <span>{Math.round(totalMacros.f)}g F</span>
                  </div>
                  <div style={{ height: 6, background: '#f0ebe3', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${calPct}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    )
  }

  // ─── DESKTOP LAYOUT (unchanged) ───────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevWeek} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ede8e0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
            {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(slotDate(weekStart, 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={nextWeek} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ede8e0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>→</button>
        </div>

        <div style={{ display: 'flex', background: '#f0e8de', borderRadius: 10, padding: 3, gap: 2 }}>
          {(['planner', 'shopping', 'instructions'] as Tab[]).map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsGF(v => !v)}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${isGF ? '#2C6E49' : '#ddd'}`,
            background: isGF ? '#2C6E49' : '#fff',
            color: isGF ? '#fff' : '#888',
          }}
        >
          🌿 GF
        </button>
      </div>

      {activeTab === 'shopping' && (
        <ShoppingListOutput items={generateShoppingList(isGF, recipes)} isGF={isGF} />
      )}
      {activeTab === 'instructions' && (
        <InstructionsOutput days={generateInstructions(recipes)} />
      )}

      {activeTab === 'planner' && (
        <DndContext
          sensors={sensors}
          modifiers={[restrictToWindowEdges]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <RecipeSidebar recipes={recipes} />
            <div style={{ flex: 1, overflowX: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading plan…</div>
              ) : (
                <div style={{ display: 'flex', gap: 10, minWidth: 'max-content' }}>
                  {Array.from({ length: 7 }, (_, i) => {
                    const date    = slotDate(weekStart, i)
                    const dayType = getDayType(date)
                    const targets = userSettings
                      ? getTargetsForDayType(userSettings, dayType)
                      : { p: 0, c: 0, f: 0, kcal: 0 }
                    return (
                      <DayColumn
                        key={i}
                        dayIndex={i}
                        date={date}
                        dayType={dayType}
                        plan={plan}
                        recipes={recipes}
                        targets={targets}
                        onSetDayType={setDayType}
                        onRemoveSlot={removeRecipeFromSlot}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <DragOverlay>
            {draggedRecipe && (
              <div style={{
                background: '#fff', borderRadius: 10, border: '2px solid #C1440E',
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)', opacity: 0.95,
              }}>
                <span style={{ fontSize: 20 }}>{draggedRecipe.emoji ?? '🍽️'}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{draggedRecipe.name}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
