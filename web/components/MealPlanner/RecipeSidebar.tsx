'use client'

import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Recipe } from '@flavor-bomb/shared'
import { calcRecipeMacros } from '@flavor-bomb/shared'

interface DraggableCardProps {
  recipe: Recipe
}

function DraggableCard({ recipe }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, type: 'recipe' },
  })

  const macros = calcRecipeMacros(recipe)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        background: '#fff',
        borderRadius: 10,
        border: '1.5px solid #ede8e0',
        padding: '10px 12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        marginBottom: 8,
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
        transition: 'box-shadow 0.15s',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{recipe.emoji ?? '🍽️'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recipe.name}
          </div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>
            {Math.round(macros.p)}g P · {Math.round(macros.c)}g C · {Math.round(macros.kcal)} kcal
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  recipes: Recipe[]
}

export default function RecipeSidebar({ recipes }: Props) {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<string>('')

  const filtered = recipes.filter(r => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = !filter || r.meal_type === filter || r.cuisine === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: '#fdf6ec',
      borderRadius: 14,
      border: '1.5px solid #ede8e0',
      padding: 14,
      height: 'fit-content',
      maxHeight: 'calc(100vh - 200px)',
      overflowY: 'auto',
    }}>
      <div style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
        Recipe Library
      </div>

      <input
        type="search"
        placeholder="Search…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', border: '1.5px solid #ede8e0', borderRadius: 8,
          padding: '6px 10px', fontSize: 12, marginBottom: 10,
          background: '#fff', outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {(['', 'breakfast', 'lunch', 'dinner'] as const).map(t => (
          <button
            key={t || 'all'}
            onClick={() => setFilter(t)}
            style={{
              padding: '3px 8px', borderRadius: 99, fontSize: 10, cursor: 'pointer',
              border: `1px solid ${filter === t ? '#C1440E' : '#ddd'}`,
              background: filter === t ? '#C1440E' : '#fff',
              color: filter === t ? '#fff' : '#888',
            }}
          >
            {t || 'All'}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10, color: '#bbb', marginBottom: 8 }}>
        {filtered.length} recipes · drag to planner
      </div>

      {filtered.map(r => <DraggableCard key={r.id} recipe={r} />)}
    </div>
  )
}
