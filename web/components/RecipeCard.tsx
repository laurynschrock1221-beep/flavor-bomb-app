'use client'

import { useState } from 'react'
import type { Recipe, DayType, MealType, UserSettings } from '@flavor-bomb/shared'
import { calcRecipeMacros, getTargetsForDayType } from '@flavor-bomb/shared'
import LogMealButton from './LogMealButton'

// ── Cuisine accent color system ──────────────────────────────
const CUISINE_COLORS: Record<string, { color: string; bg: string }> = {
  Korean:          { color: '#C1440E', bg: '#ffe8d6' },
  Asian:           { color: '#2C6E49', bg: '#e8f5ee' },
  Mexican:         { color: '#8B5E3C', bg: '#fef3e8' },
  Japanese:        { color: '#1A5276', bg: '#e8eef5' },
  'Korean-Fusion': { color: '#6B2D8B', bg: '#f0eaf8' },
  'Korean-Mex':    { color: '#8B5E3C', bg: '#fef3e8' },
  Mediterranean:   { color: '#6B2D8B', bg: '#f0eaf8' },
  Other:           { color: '#5C5C5C', bg: '#f3f3f0' },
}

function getAccent(cuisine: string | null) {
  return CUISINE_COLORS[cuisine ?? ''] ?? CUISINE_COLORS.Other
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'side']
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
  side:      'Side',
}

interface Props {
  recipe:       Recipe
  dayType?:     DayType
  isGF?:        boolean
  isLC?:        boolean
  userSettings?: UserSettings | null
  compact?:     boolean
  isFavorite?:  boolean
  onToggleFavorite?: (id: string) => void
  onMealTypeChange?: (mealType: MealType) => void
}

export default function RecipeCard({
  recipe,
  dayType    = 'moderate',
  isGF       = false,
  isLC       = false,
  userSettings,
  compact    = false,
  isFavorite = false,
  onToggleFavorite,
  onMealTypeChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const accent = getAccent(recipe.cuisine)
  const macros = calcRecipeMacros(recipe, { isGF, isLC })

  const defaultSettings = {
    calorie_target_min: 1800, calorie_target_max: 2200,
    protein_target_min: 140,  protein_target_max: 180,
    carb_target_g: 200, fat_target_g: 65,
    tdee: null, food_restrictions: null, personal_context: null,
  }
  const targets = getTargetsForDayType(userSettings ?? defaultSettings, dayType)

  function toggle() {
    if (!compact) setIsOpen(v => !v)
  }

  return (
    <div
      onClick={toggle}
      style={{
        background:   '#ffffff',
        borderRadius: 16,
        boxShadow:    '0 2px 12px rgba(0,0,0,0.07)',
        border:       isOpen ? `2px solid ${accent.color}` : '2px solid transparent',
        cursor:       compact ? 'default' : 'pointer',
        overflow:     'hidden',
        transition:   'box-shadow 0.2s, border 0.2s',
        fontFamily:   'DM Sans, system-ui, sans-serif',
      }}
    >
      {/* ── Header row ──────────────────────────────────────── */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Emoji icon block */}
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: accent.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, flexShrink: 0,
          }}>
            {recipe.emoji ?? '🍽️'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Course + cuisine tag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              {(recipe.meal_type ?? []).map(mt => (
                <span key={mt} style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 1,
                  textTransform: 'uppercase', color: accent.color,
                }}>
                  {MEAL_LABELS[mt]}
                </span>
              ))}
              {recipe.cuisine && (
                <span style={{
                  fontSize: 10, color: '#999', letterSpacing: 0.5,
                }}>
                  {recipe.cuisine}
                </span>
              )}
            </div>
            {/* Recipe name */}
            <div style={{
              fontFamily:  'Georgia, serif',
              fontSize:    16,
              fontWeight:  700,
              color:       '#1a1a1a',
              lineHeight:  1.3,
            }}>
              {recipe.name}
            </div>
            {/* Time + tag pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
              {(recipe.prep_time || recipe.cook_time) && (
                <span style={{ fontSize: 11, color: '#888' }}>
                  {[recipe.prep_time, recipe.cook_time].filter(Boolean).join(' + ')}
                </span>
              )}
              {(recipe.servings ?? 1) > 1 && (
                <span style={{ fontSize: 11, color: '#888' }}>
                  {recipe.servings} servings
                </span>
              )}
              {recipe.tag && (
                <span style={{
                  fontSize: 11, background: accent.bg,
                  color: accent.color, borderRadius: 99,
                  padding: '2px 8px', fontWeight: 600,
                }}>
                  {recipe.tag}
                </span>
              )}
              {recipe.is_gf && (
                <span style={{
                  fontSize: 11, background: '#e8f5ee',
                  color: '#2C6E49', borderRadius: 99,
                  padding: '2px 8px', fontWeight: 600,
                }}>
                  GF
                </span>
              )}
            </div>
          </div>

          {/* Favorite + Chevron */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 2 }}>
            {onToggleFavorite && (
              <button
                onClick={e => { e.stopPropagation(); onToggleFavorite(recipe.id) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 18, padding: '2px 4px', lineHeight: 1,
                  color: isFavorite ? '#f59e0b' : '#ddd',
                  transition: 'color 0.15s',
                }}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? '★' : '☆'}
              </button>
            )}
            {!compact && (
              <div style={{
                color: '#bbb', fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}>
                ▾
              </div>
            )}
          </div>
        </div>

        {/* ── Macro chips row ───────────────────────────────── */}
        <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f3f0eb' }}>
          {[
            { label: 'Protein', value: Math.round(macros.p),    unit: 'g',    accent: true },
            { label: 'Carbs',   value: Math.round(macros.c),    unit: 'g',    accent: false },
            { label: 'Fat',     value: Math.round(macros.f),    unit: 'g',    accent: false },
            { label: 'Kcal',    value: Math.round(macros.kcal), unit: '',     accent: false },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 16, fontWeight: 700,
                color: m.accent ? accent.color : '#888',
              }}>
                {m.value}{m.unit}
              </div>
              <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 1 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Expanded content ──────────────────────────────────── */}
      {isOpen && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ padding: '0 16px 16px', background: '#fdf6ec' }}
        >
          {/* Meal type multi-select */}
          {onMealTypeChange && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '12px 0 4px' }}>
              {MEAL_TYPES.map(mt => {
                const active = (recipe.meal_type ?? []).includes(mt)
                return (
                  <button
                    key={mt}
                    onClick={() => onMealTypeChange(mt)}
                    style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', border: `1.5px solid ${active ? accent.color : '#e5e0d8'}`,
                      background: active ? accent.color : '#fff',
                      color: active ? '#fff' : '#888',
                      transition: 'all 0.15s',
                    }}
                  >
                    {MEAL_LABELS[mt]}
                  </button>
                )
              })}
            </div>
          )}

          {/* Description */}
          {recipe.description && (
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '12px 0' }}>
              {recipe.description}
            </p>
          )}

          {/* Pro tip callout */}
          {recipe.tip && (
            <div style={{
              background: accent.bg, borderRadius: 10, padding: '10px 14px',
              marginBottom: 14, fontSize: 13, color: '#333', lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 700, color: accent.color }}>💡 Pro tip: </span>
              {recipe.tip}
            </div>
          )}

          {/* Instructions */}
          {recipe.instructions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>
                Instructions
              </div>
              {recipe.instructions.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: accent.bg, border: `1.5px solid ${accent.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: accent.color,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: 13, color: '#444', lineHeight: 1.55, margin: 0 }}>{step}</p>
                </div>
              ))}
            </div>
          )}

          {/* Ingredients */}
          {(recipe.ingredients?.length ?? 0) > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#333' }}>
                Ingredients
              </div>
              {[...( recipe.ingredients ?? [])].sort((a, b) => a.sort_order - b.sort_order).map(ing => (
                <div key={ing.id} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'baseline' }}>
                  <span style={{ color: accent.color, fontSize: 14, lineHeight: 1 }}>•</span>
                  <span style={{ fontSize: 13, color: '#444' }}>
                    {ing.quantity != null ? `${ing.quantity}${ing.unit ? ' ' + ing.unit : ''} ` : ''}
                    {isLC && ing.lc_swap
                      ? <><span style={{ textDecoration: 'line-through', color: '#aaa' }}>{ing.name}</span>
                          {' '}<span style={{ color: '#8B5E3C', fontWeight: 600 }}>{ing.lc_swap}</span></>
                      : isGF && !ing.is_gf && ing.gf_swap
                        ? <><span style={{ textDecoration: 'line-through', color: '#aaa' }}>{ing.name}</span>
                            {' '}<span style={{ color: accent.color, fontWeight: 600 }}>{ing.gf_swap}</span></>
                        : ing.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Log to tracker */}
          <div style={{ marginBottom: 14 }}>
            <LogMealButton recipe={recipe} isGF={isGF} isLC={isLC} accentColor={accent.color} />
          </div>

          {/* Day type macro detail */}
          <div style={{
            background: '#f8f6f2', borderRadius: 10, padding: '10px 14px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {[
              { label: 'Protein',  planned: Math.round(macros.p),    target: Math.round(targets.p),    unit: 'g'  },
              { label: 'Carbs',    planned: Math.round(macros.c),    target: Math.round(targets.c),    unit: 'g'  },
              { label: 'Fat',      planned: Math.round(macros.f),    target: Math.round(targets.f),    unit: 'g'  },
              { label: 'Calories', planned: Math.round(macros.kcal), target: Math.round(targets.kcal), unit: 'kcal' },
            ].map(m => {
              const pct = m.target > 0 ? Math.min(100, Math.round((m.planned / m.target) * 100)) : 0
              return (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                    <span style={{ color: '#666' }}>{m.label}</span>
                    <span style={{ color: '#999' }}>{m.planned}/{m.target}{m.unit}</span>
                  </div>
                  <div style={{ height: 4, background: '#e8e4de', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', borderRadius: 2, width: `${pct}%`,
                      background: pct > 110 ? '#C1440E' : pct > 85 ? '#2C6E49' : accent.color,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
