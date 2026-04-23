'use client'

import { useDroppable } from '@dnd-kit/core'
import type { MealPlan, Recipe, DayType, MealType, MacroSet } from '@flavor-bomb/shared'
import { calcRecipeMacros } from '@flavor-bomb/shared'
import DayTypeToggle from '../DayTypeToggle'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner']
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface Props {
  dayIndex:    number
  date:        string
  dayType:     DayType
  plan:        MealPlan | null
  recipes:     Recipe[]
  targets:     MacroSet
  onSetDayType: (date: string, dt: DayType) => void
  onRemoveSlot: (day: number, mealType: MealType) => void
}

interface DroppableSlotProps {
  id:        string
  recipe:    Recipe | undefined
  mealType:  MealType
  dayIndex:  number
  onRemove:  () => void
}

function DroppableSlot({ id, recipe, mealType, onRemove }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 58,
        borderRadius: 10,
        border: `2px dashed ${isOver ? '#C1440E' : '#e5e0d8'}`,
        background: isOver ? '#fff3ef' : recipe ? '#fff' : '#fdf6ec',
        padding: '6px 8px',
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
        {mealType}
      </div>
      {recipe ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>{recipe.emoji ?? '🍽️'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recipe.name}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#ccc', fontSize: 16, padding: '0 2px', lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center', paddingTop: 4 }}>
          Drop here
        </div>
      )}
    </div>
  )
}

export default function DayColumn({
  dayIndex, date, dayType, plan, recipes, targets, onSetDayType, onRemoveSlot,
}: Props) {
  const recipeMap = new Map(recipes.map(r => [r.id, r]))
  const daySlots  = (plan?.slots ?? []).filter(s => s.day === dayIndex)

  // Compute total day macros from planned recipes
  const totalMacros = daySlots.reduce((acc, slot) => {
    const r = recipeMap.get(slot.recipe_id)
    if (!r) return acc
    const m = calcRecipeMacros(r)
    return { p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f, kcal: acc.kcal + m.kcal }
  }, { p: 0, c: 0, f: 0, kcal: 0 })

  const calPct = targets.kcal > 0 ? Math.min(100, Math.round((totalMacros.kcal / targets.kcal) * 100)) : 0
  const barColor = calPct > 110 ? '#C1440E' : calPct > 85 ? '#2C6E49' : '#8B5E3C'

  return (
    <div style={{
      minWidth: 160, width: 160, flexShrink: 0,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Day header */}
      <div style={{ textAlign: 'center', paddingBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{DAY_LABELS[dayIndex]}</div>
        <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>
          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <DayTypeToggle value={dayType} onChange={dt => onSetDayType(date, dt)} size="sm" />
      </div>

      {/* Meal slots */}
      {MEAL_TYPES.map(mealType => {
        const slot   = daySlots.find(s => s.meal_type === mealType)
        const recipe = slot ? recipeMap.get(slot.recipe_id) : undefined
        const dropId = `day-${dayIndex}-${mealType}`
        return (
          <DroppableSlot
            key={mealType}
            id={dropId}
            recipe={recipe}
            mealType={mealType}
            dayIndex={dayIndex}
            onRemove={() => onRemoveSlot(dayIndex, mealType)}
          />
        )
      })}

      {/* Calorie total bar */}
      <div style={{ paddingTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', marginBottom: 3 }}>
          <span>{Math.round(totalMacros.kcal)} kcal</span>
          <span>/{Math.round(targets.kcal)}</span>
        </div>
        <div style={{ height: 4, background: '#f0ebe3', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${calPct}%`, background: barColor, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  )
}
