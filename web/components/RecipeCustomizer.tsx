'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Recipe, MacroSet } from '@flavor-bomb/shared'
import { calcIngredientMacros } from '@flavor-bomb/shared'

interface Props {
  recipe:    Recipe
  isGF:      boolean
  isLC:      boolean
  accentColor: string
  onChange:  (macros: MacroSet | null) => void  // null = back to recipe default
}

export default function RecipeCustomizer({ recipe, isGF, isLC, accentColor, onChange }: Props) {
  const ingredients = recipe.ingredients ?? []
  const servings    = Math.max(1, recipe.servings ?? 1)

  const [enabled, setEnabled]     = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ingredients.map(i => [i.id, true]))
  )
  const [qtys, setQtys]           = useState<Record<string, number>>(() =>
    Object.fromEntries(ingredients.map(i => [i.id, i.quantity ?? 1]))
  )

  const calcCustomMacros = useCallback(
    (en: Record<string, boolean>, q: Record<string, number>): MacroSet => {
      const total = ingredients.reduce((acc, ing) => {
        if (!en[ing.id]) return acc
        const m = calcIngredientMacros({ ...ing, quantity: q[ing.id] ?? ing.quantity }, isGF, isLC)
        return { p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f, kcal: acc.kcal + m.kcal }
      }, { p: 0, c: 0, f: 0, kcal: 0 } as MacroSet)
      return { p: total.p / servings, c: total.c / servings, f: total.f / servings, kcal: total.kcal / servings }
    },
    [ingredients, isGF, isLC, servings]
  )

  useEffect(() => {
    const isDefault = ingredients.every(i => enabled[i.id] && qtys[i.id] === (i.quantity ?? 1))
    onChange(isDefault ? null : calcCustomMacros(enabled, qtys))
  }, [enabled, qtys, calcCustomMacros, ingredients, onChange])

  function toggleIngredient(id: string) {
    setEnabled(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function adjustQty(id: string, delta: number) {
    setQtys(prev => {
      const next = Math.max(0, +(prev[id] + delta).toFixed(2))
      return { ...prev, [id]: next }
    })
  }

  function reset() {
    setEnabled(Object.fromEntries(ingredients.map(i => [i.id, true])))
    setQtys(Object.fromEntries(ingredients.map(i => [i.id, i.quantity ?? 1])))
    onChange(null)
  }

  const isModified = ingredients.some(i => !enabled[i.id] || qtys[i.id] !== (i.quantity ?? 1))
  const live       = calcCustomMacros(enabled, qtys)
  const hasMacros  = ingredients.some(i => i.macros !== null)

  if (!hasMacros) {
    return (
      <div style={{ fontSize: 12, color: '#bbb', padding: '8px 0', fontStyle: 'italic' }}>
        No per-ingredient macro data — edit saved recipe to add it.
      </div>
    )
  }

  return (
    <div style={{ marginTop: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Customize
        </span>
        {isModified && (
          <button
            onClick={reset}
            style={{ fontSize: 11, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Ingredient rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[...ingredients].sort((a, b) => a.sort_order - b.sort_order).map(ing => {
          const on      = enabled[ing.id]
          const qty     = qtys[ing.id]
          const origQty = ing.quantity ?? 1

          return (
            <div
              key={ing.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 8,
                background: on ? '#fdf6ec' : '#f5f5f5',
                border: `1.5px solid ${on ? '#ede8e0' : '#eee'}`,
                opacity: on ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
            >
              {/* Toggle checkbox */}
              <button
                onClick={() => toggleIngredient(ing.id)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `2px solid ${on ? accentColor : '#ccc'}`,
                  background: on ? accentColor : '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {on && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1, fontWeight: 700 }}>✓</span>}
              </button>

              {/* Name */}
              <span style={{
                flex: 1, fontSize: 12, color: '#333',
                textDecoration: on ? 'none' : 'line-through',
              }}>
                {ing.name}
                {ing.unit ? ` (${ing.unit})` : ''}
              </span>

              {/* Quantity stepper — only show when ingredient has a quantity */}
              {ing.quantity !== null && on && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    onClick={() => adjustQty(ing.id, -0.5)}
                    disabled={qty <= 0}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: `1px solid ${accentColor}`,
                      background: '#fff', color: accentColor, fontSize: 14, fontWeight: 700,
                      cursor: qty > 0 ? 'pointer' : 'default', lineHeight: 1,
                    }}
                  >−</button>
                  <span style={{
                    minWidth: 28, textAlign: 'center', fontSize: 12, fontWeight: 600,
                    color: qty !== origQty ? accentColor : '#555',
                  }}>
                    {qty % 1 === 0 ? qty : qty.toFixed(1)}
                  </span>
                  <button
                    onClick={() => adjustQty(ing.id, 0.5)}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: `1px solid ${accentColor}`,
                      background: '#fff', color: accentColor, fontSize: 14, fontWeight: 700,
                      cursor: 'pointer', lineHeight: 1,
                    }}
                  >+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Live macro preview (only show when modified) */}
      {isModified && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 8,
          background: '#fff', border: `1.5px solid ${accentColor}`,
          display: 'flex', gap: 16,
        }}>
          {[
            { label: 'P',    val: Math.round(live.p)    },
            { label: 'C',    val: Math.round(live.c)    },
            { label: 'F',    val: Math.round(live.f)    },
            { label: 'kcal', val: Math.round(live.kcal) },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: accentColor }}>{m.val}</div>
              <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.8 }}>{m.label}</div>
            </div>
          ))}
          <div style={{ marginLeft: 'auto', fontSize: 10, color: '#aaa', alignSelf: 'center', fontStyle: 'italic' }}>
            customized
          </div>
        </div>
      )}
    </div>
  )
}
