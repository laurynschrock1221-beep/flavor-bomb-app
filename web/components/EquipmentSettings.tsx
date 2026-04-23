'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const EQUIPMENT_OPTIONS = [
  { id: 'blackstone',  label: 'Blackstone Griddle', emoji: '🔥' },
  { id: 'air_fryer',  label: 'Air Fryer',           emoji: '💨' },
  { id: 'oven',       label: 'Oven',                emoji: '🍳' },
  { id: 'stovetop',   label: 'Stovetop',            emoji: '🥘' },
  { id: 'instant_pot',label: 'Instant Pot',         emoji: '⚡' },
  { id: 'slow_cooker',label: 'Slow Cooker',         emoji: '🍲' },
  { id: 'grill',      label: 'Outdoor Grill',       emoji: '🪵' },
  { id: 'sous_vide',  label: 'Sous Vide',           emoji: '🌡️' },
  { id: 'microwave',  label: 'Microwave',           emoji: '📡' },
  { id: 'no_cook',    label: 'No cook needed',      emoji: '🥗' },
]

export default function EquipmentSettings() {
  const supabase = createClient()
  const [selected, setSelected] = useState<string[]>([])
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await (supabase as any).schema('recipes').from('user_equipment')
        .select('equipment').eq('user_id', user.id).maybeSingle()
      if (data?.equipment) setSelected(data.equipment)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await (supabase as any).schema('recipes').from('user_equipment')
      .upsert({ user_id: user.id, equipment: selected, updated_at: new Date().toISOString() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e5e0d8', padding: '20px 24px' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>My Equipment</div>
      <div style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>
        Select what you have — the AI will prioritize these when creating recipes.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {EQUIPMENT_OPTIONS.map(eq => {
          const active = selected.includes(eq.id)
          return (
            <button
              key={eq.id}
              onClick={() => setSelected(prev => prev.includes(eq.id) ? prev.filter(x => x !== eq.id) : [...prev, eq.id])}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${active ? '#C1440E' : '#e5e0d8'}`,
                background: active ? '#fff3ef' : '#fff',
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? '#C1440E' : '#555',
                transition: 'all 0.15s',
              }}
            >
              <span>{eq.emoji}</span>
              <span>{eq.label}</span>
            </button>
          )
        })}
      </div>
      <button onClick={handleSave} disabled={saving} style={{
        padding: '9px 20px', borderRadius: 10, border: 'none',
        background: saved ? '#2C6E49' : '#C1440E', color: '#fff',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s',
      }}>
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Equipment'}
      </button>
    </div>
  )
}
