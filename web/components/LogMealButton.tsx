'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calcRecipeMacros } from '@flavor-bomb/shared'
import type { Recipe, MacroSet } from '@flavor-bomb/shared'

interface Props {
  recipe:        Recipe
  isGF?:         boolean
  isLC?:         boolean
  accentColor:   string
  macroOverride?: MacroSet   // custom macros from RecipeCustomizer
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function nowTime() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function LogMealButton({ recipe, isGF = false, isLC = false, accentColor, macroOverride }: Props) {
  const supabase = createClient()
  const [open,   setOpen]   = useState(false)
  const [date,   setDate]   = useState(todayStr)
  const [time,   setTime]   = useState(nowTime)
  const [status, setStatus] = useState<'logged' | 'planned'>('logged')
  const [notes,  setNotes]  = useState('')
  const [saving, setSaving] = useState(false)
  const [done,   setDone]   = useState(false)

  const macros = macroOverride ?? calcRecipeMacros(recipe, { isGF, isLC })

  const ingredientText = (recipe.ingredients ?? [])
    .map(i => [i.quantity, i.unit, i.name].filter(Boolean).join(' '))
    .join(', ')

  async function handleLog() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    await supabase.from('logged_meals').insert({
      id:                   crypto.randomUUID(),
      user_id:              user.id,
      date,
      time,
      meal_name:            recipe.name,
      ingredient_text:      ingredientText || recipe.description || recipe.name,
      estimated_calories:   Math.round(macros.kcal),
      estimated_protein:    Math.round(macros.p),
      estimated_carbs:      Math.round(macros.c),
      estimated_fat:        Math.round(macros.f),
      status,
      notes:                notes || null,
    })

    setSaving(false)
    setDone(true)
    setTimeout(() => { setDone(false); setOpen(false) }, 1500)
  }

  const inputStyle: React.CSSProperties = {
    borderRadius: 8, border: '1.5px solid #e5e0d8', padding: '8px 10px',
    fontSize: 13, background: '#fff', outline: 'none', width: '100%',
    fontFamily: 'DM Sans, system-ui, sans-serif', boxSizing: 'border-box',
  }

  return (
    <div>
      <button
        onClick={() => { setOpen(v => !v); setDone(false) }}
        style={{
          padding: '7px 14px', borderRadius: 8, border: `1.5px solid ${accentColor}`,
          background: open ? accentColor : '#fff', color: open ? '#fff' : accentColor,
          fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        📋 Log Meal
      </button>

      {open && !done && (
        <div style={{
          marginTop: 10, background: '#f8f6f2', borderRadius: 12,
          padding: '14px 16px', border: '1.5px solid #e5e0d8',
        }}>
          {/* Macro preview */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #ede8e0' }}>
            {[
              { label: 'Protein', val: Math.round(macros.p),    unit: 'g', color: accentColor },
              { label: 'Carbs',   val: Math.round(macros.c),    unit: 'g', color: '#888' },
              { label: 'Fat',     val: Math.round(macros.f),    unit: 'g', color: '#888' },
              { label: 'Kcal',    val: Math.round(macros.kcal), unit: '',  color: '#888' },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: m.color }}>{m.val}{m.unit}</div>
                <div style={{ fontSize: 9, color: '#bbb', textTransform: 'uppercase', letterSpacing: 0.8 }}>{m.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>Date</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>Time</div>
              <input type="time" value={time} onChange={e => setTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(['logged', 'planned'] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                flex: 1, padding: '7px', borderRadius: 8, border: `1.5px solid ${status === s ? accentColor : '#e5e0d8'}`,
                background: status === s ? accentColor : '#fff',
                color: status === s ? '#fff' : '#888',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
              }}>{s}</button>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4 }}>Notes <span style={{ fontWeight: 400 }}>(optional)</span></div>
            <input value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. used chicken breast instead" style={inputStyle} />
          </div>

          <button onClick={handleLog} disabled={saving} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: saving ? '#e5e0d8' : accentColor, color: saving ? '#aaa' : '#fff',
            fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
          }}>
            {saving ? 'Logging…' : `Log as ${status}`}
          </button>
        </div>
      )}

      {done && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#2C6E49', fontWeight: 600 }}>
          ✓ Logged to your tracker
        </div>
      )}
    </div>
  )
}
