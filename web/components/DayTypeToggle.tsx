'use client'

import type { DayType } from '@flavor-bomb/shared'

const OPTIONS: { value: DayType; label: string; color: string }[] = [
  { value: 'rest',     label: 'Rest',     color: '#2C6E49' },
  { value: 'moderate', label: 'Moderate', color: '#8B5E3C' },
  { value: 'high',     label: 'Training', color: '#C1440E' },
]

interface Props {
  value:    DayType
  onChange: (v: DayType) => void
  size?:    'sm' | 'md'
}

export default function DayTypeToggle({ value, onChange, size = 'md' }: Props) {
  const px = size === 'sm' ? '8px 10px' : '7px 14px'
  const fs = size === 'sm' ? 11 : 12

  return (
    <div style={{
      display: 'inline-flex',
      background: '#f0e8de',
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}>
      {OPTIONS.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: px,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontWeight: active ? 700 : 400,
              fontSize: fs,
              background: active ? opt.color : 'transparent',
              color: active ? '#fff' : '#888',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
