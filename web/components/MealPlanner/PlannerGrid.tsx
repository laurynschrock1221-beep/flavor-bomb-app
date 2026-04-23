'use client'

import { useState } from 'react'
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
  useMealPlan, useMacros, getWeekStart, slotDate, getTargetsForDayType,
} from '@flavor-bomb/shared'
import type { Recipe, DayType, MealType, UserSettings } from '@flavor-bomb/shared'
import DayColumn      from './DayColumn'
import RecipeSidebar  from './RecipeSidebar'
import ShoppingListOutput  from './ShoppingListOutput'
import InstructionsOutput  from './InstructionsOutput'

type Tab = 'planner' | 'shopping' | 'instructions'

interface Props {
  recipes:      Recipe[]
  userSettings: UserSettings | null
}

export default function PlannerGrid({ recipes, userSettings }: Props) {
  const supabase  = createClient()
  const [weekStart, setWeekStart] = useState(getWeekStart())
  const [activeTab, setActiveTab] = useState<Tab>('planner')
  const [isGF, setIsGF]           = useState(false)
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null)

  const { plan, loading, addRecipeToSlot, removeRecipeFromSlot, setDayType, getDayType, generateShoppingList, generateInstructions } =
    useMealPlan(supabase, weekStart)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  )

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

    // droppable id format: "day-{dayIndex}-{mealType}"
    const parts = String(over.id).split('-')
    if (parts[0] !== 'day' || parts.length !== 3) return

    const dayIndex  = parseInt(parts[1])
    const mealType  = parts[2] as MealType
    const date      = slotDate(weekStart, dayIndex)
    const dayType: DayType = getDayType(date)

    await addRecipeToSlot(dayIndex, mealType, recipeId, dayType)
  }

  const tabStyle = (tab: Tab) => ({
    padding: '8px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
    border: 'none', background: activeTab === tab ? '#C1440E' : 'transparent',
    color: activeTab === tab ? '#fff' : '#888', transition: 'all 0.15s',
  })

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Week nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevWeek} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ede8e0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 120, textAlign: 'center' }}>
            {new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(slotDate(weekStart, 6)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={nextWeek} style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #ede8e0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>→</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f0e8de', borderRadius: 10, padding: 3, gap: 2 }}>
          <button style={tabStyle('planner')}      onClick={() => setActiveTab('planner')}>Planner</button>
          <button style={tabStyle('shopping')}     onClick={() => setActiveTab('shopping')}>Shopping</button>
          <button style={tabStyle('instructions')} onClick={() => setActiveTab('instructions')}>Instructions</button>
        </div>

        {/* GF toggle */}
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

      {/* Tab content */}
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
            {/* Sidebar */}
            <RecipeSidebar recipes={recipes} />

            {/* 7-day grid */}
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

          {/* Drag overlay ghost */}
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
