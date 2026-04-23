'use client'

import type { MacroSet, DayType } from '@flavor-bomb/shared'

interface Props {
  planned: MacroSet
  targets: MacroSet
  dayType: DayType
  compact?: boolean
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ height: 6, background: '#f0ebe3', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
    </div>
  )
}

const DAY_TYPE_LABELS: Record<DayType, string> = {
  rest:     'Rest day',
  moderate: 'Moderate day',
  high:     'Training day',
}

export default function MacroSummary({ planned, targets, dayType, compact = false }: Props) {
  const macros = [
    { label: 'Protein',  planned: Math.round(planned.p),    target: Math.round(targets.p),    unit: 'g',    color: '#C1440E' },
    { label: 'Carbs',    planned: Math.round(planned.c),    target: Math.round(targets.c),    unit: 'g',    color: '#2C6E49' },
    { label: 'Fat',      planned: Math.round(planned.f),    target: Math.round(targets.f),    unit: 'g',    color: '#8B5E3C' },
    { label: 'Calories', planned: Math.round(planned.kcal), target: Math.round(targets.kcal), unit: 'kcal', color: '#1A5276' },
  ]

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
        {macros.map(m => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: m.color }}>{m.planned}</div>
            <div style={{ color: '#aaa', fontSize: 10 }}>{m.label}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      background: '#fdf6ec', borderRadius: 12, padding: 16,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: '#444' }}>Daily targets</span>
        <span style={{ fontSize: 11, color: '#aaa' }}>{DAY_TYPE_LABELS[dayType]}</span>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {macros.map(m => (
          <div key={m.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#666' }}>{m.label}</span>
              <span style={{ color: '#999' }}>{m.planned} / {m.target}{m.unit}</span>
            </div>
            <Bar value={m.planned} max={m.target} color={m.color} />
          </div>
        ))}
      </div>
    </div>
  )
}
