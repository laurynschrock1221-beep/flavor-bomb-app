'use client'

import type { DayInstructions } from '@flavor-bomb/shared'

const CUISINE_COLORS: Record<string, { color: string; bg: string }> = {
  Korean:        { color: '#C1440E', bg: '#ffe8d6' },
  Asian:         { color: '#2C6E49', bg: '#e8f5ee' },
  Mexican:       { color: '#8B5E3C', bg: '#fef3e8' },
  Japanese:      { color: '#1A5276', bg: '#e8eef5' },
  Mediterranean: { color: '#6B2D8B', bg: '#f0eaf8' },
  Other:         { color: '#5C5C5C', bg: '#f3f3f0' },
}

interface Props {
  days: DayInstructions[]
}

export default function InstructionsOutput({ days }: Props) {
  if (days.length === 0) {
    return <p style={{ color: '#aaa', fontSize: 13 }}>No meals planned yet.</p>
  }

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 18 }}>Week Instructions</h3>
        <button
          onClick={() => window.print()}
          style={{
            padding: '7px 14px', background: '#C1440E', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          🖨️ Print
        </button>
      </div>

      {days.map(day => (
        <div key={day.date} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C1440E', flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              <span style={{
                marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: day.day_type === 'high' ? '#FEF0EB' : day.day_type === 'rest' ? '#F5EFE4' : '#f0f0f0',
                color: day.day_type === 'high' ? '#C1440E' : day.day_type === 'rest' ? '#2C6E49' : '#888',
                fontWeight: 600,
              }}>
                {day.day_type}
              </span>
            </div>
          </div>

          {day.meals.map(({ meal_type, recipe }) => {
            const accent = CUISINE_COLORS[recipe.cuisine ?? ''] ?? CUISINE_COLORS.Other
            return (
              <div
                key={meal_type}
                style={{
                  background: '#fff',
                  border: `1.5px solid ${accent.color}20`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 10,
                  marginLeft: 18,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{recipe.emoji ?? '🍽️'}</span>
                  <div>
                    <div style={{ fontSize: 10, color: accent.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {meal_type}
                    </div>
                    <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 15 }}>{recipe.name}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 11, color: '#aaa' }}>
                    {[recipe.prep_time, recipe.cook_time].filter(Boolean).join(' + ')}
                  </div>
                </div>

                {recipe.tip && (
                  <div style={{ background: accent.bg, borderRadius: 8, padding: '7px 10px', fontSize: 12, marginBottom: 10, color: '#333' }}>
                    <strong style={{ color: accent.color }}>💡 </strong>{recipe.tip}
                  </div>
                )}

                {recipe.instructions.length > 0 && (
                  <ol style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                    {recipe.instructions.map((step, i) => (
                      <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                          background: accent.bg, color: accent.color, border: `1.5px solid ${accent.color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700, marginTop: 2,
                        }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, color: '#444', lineHeight: 1.55 }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
