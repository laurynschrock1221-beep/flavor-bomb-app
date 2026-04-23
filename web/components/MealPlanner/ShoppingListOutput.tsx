'use client'

import type { ShoppingListItem } from '@flavor-bomb/shared'

interface Props {
  items: ShoppingListItem[]
  isGF: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  Proteins:          '🥩',
  Produce:           '🥦',
  Dairy:             '🧀',
  'Grains & Frozen': '🌾',
  Pantry:            '🫙',
}

export default function ShoppingListOutput({ items, isGF }: Props) {
  if (items.length === 0) {
    return <p style={{ color: '#aaa', fontSize: 13 }}>No ingredients planned yet.</p>
  }

  // Group by category
  const grouped = items.reduce<Record<string, ShoppingListItem[]>>((acc, item) => {
    const cat = item.category ?? 'Other'
    ;(acc[cat] ??= []).push(item)
    return acc
  }, {})

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 18 }}>Shopping List</h3>
        {isGF && (
          <span style={{ fontSize: 11, background: '#e8f5ee', color: '#2C6E49', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>
            GF Mode
          </span>
        )}
      </div>

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            {CATEGORY_ICONS[category] ?? '•'} {category}
          </div>
          {catItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '6px 0', borderBottom: '1px solid #f5f0e8',
              fontSize: 13,
            }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid #d4c9bc', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, color: item.is_gf ? '#333' : '#555' }}>
                {item.quantity != null ? `${item.quantity} ${item.unit ?? ''} `.trim() + ' ' : ''}
                {item.name}
                {!item.is_gf && item.gf_swap && isGF && (
                  <span style={{ fontSize: 11, color: '#2C6E49', marginLeft: 4 }}>
                    (use {item.gf_swap})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={() => window.print()}
        style={{
          marginTop: 8, padding: '8px 18px', background: '#C1440E',
          color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        🖨️ Print
      </button>
    </div>
  )
}
