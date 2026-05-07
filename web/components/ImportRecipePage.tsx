'use client'

import { useState, useRef } from 'react'
import { useRouter }        from 'next/navigation'
import { createClient }     from '@/lib/supabase/client'
import { recipesDb }        from '@flavor-bomb/shared'
import type { Recipe, Ingredient } from '@flavor-bomb/shared'

type ParsedRecipe = Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'> & {
  ingredients: Omit<Ingredient, 'id' | 'recipe_id' | 'created_at'>[]
}

export default function ImportRecipePage() {
  const router   = useRouter()
  const supabase = createClient()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [preview,  setPreview]  = useState<string | null>(null)
  const [parsed,   setParsed]   = useState<ParsedRecipe | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    setParsed(null)

    const form = new FormData()
    form.append('image', file)

    const res = await fetch('/api/parse-recipe', { method: 'POST', body: form })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Parse failed')
      setLoading(false)
      return
    }

    const recipe = json.recipe as ParsedRecipe

    // If any ingredients came back without macros, fill them in now
    const ings = recipe.ingredients ?? []
    const needsMacros = ings.some(i => !i.macros)
    if (needsMacros && ings.length > 0) {
      try {
        const macroRes = await fetch('/api/estimate-macros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredients: ings.map(i => ({ name: i.name, quantity: i.quantity, unit: i.unit })) }),
        })
        const macroJson = await macroRes.json()
        if (Array.isArray(macroJson.macros) && macroJson.macros.length === ings.length) {
          recipe.ingredients = ings.map((ing, i) => ({
            ...ing,
            macros: ing.macros ?? macroJson.macros[i] ?? null,
          }))
        }
      } catch {
        // non-fatal — save without macros, user can estimate later
      }
    }

    setParsed(recipe)
    setImageUrl(json.source_image_url)
    setLoading(false)
  }

  async function handleSave() {
    if (!parsed) return
    setSaving(true)
    setError(null)

    const { ingredients, ...recipeData } = parsed

    const { data: newRecipe, error: recipeErr } = await recipesDb(supabase)
      .from('recipes')
      .insert({ ...recipeData, source_image_url: imageUrl })
      .select()
      .single()

    if (recipeErr) { setError(recipeErr.message); setSaving(false); return }

    if (ingredients?.length) {
      const rows = ingredients.map((ing, i) => ({
        ...ing,
        recipe_id:  (newRecipe as Recipe).id,
        sort_order: i,
      }))
      const { error: ingErr } = await recipesDb(supabase).from('ingredients').insert(rows)
      if (ingErr) { setError(ingErr.message); setSaving(false); return }
    }

    router.push(`/recipes/${(newRecipe as Recipe).id}`)
    router.refresh()
  }

  const dropZoneStyle: React.CSSProperties = {
    border: '2px dashed #d4c9bc',
    borderRadius: 14,
    padding: '40px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#fdf6ec',
    transition: 'border-color 0.2s',
  }

  return (
    <div style={{ fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Upload zone */}
      <div
        style={dropZoneStyle}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" style={{ maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
        ) : (
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop a recipe screenshot here</div>
            <div style={{ color: '#aaa', fontSize: 13 }}>or click to browse</div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 24, color: '#888' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
          Parsing recipe with Claude…
        </div>
      )}

      {error && <p style={{ color: '#C1440E', marginTop: 12, fontSize: 14 }}>{error}</p>}

      {/* Parsed preview */}
      {parsed && !loading && (
        <div style={{ marginTop: 24, background: '#fff', borderRadius: 14, border: '1.5px solid #e8e2d9', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0ebe3' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32 }}>{parsed.emoji ?? '🍽️'}</span>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 }}>{parsed.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {[parsed.cuisine, parsed.meal_type, parsed.cook_time].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '14px 20px' }}>
            {parsed.description && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>{parsed.description}</p>}

            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
              {parsed.ingredients?.length ?? 0} ingredients parsed
              {parsed.instructions?.length ? ` · ${parsed.instructions.length} steps` : ''}
            </div>

            <div style={{ fontSize: 12, color: '#666' }}>
              <strong>Note:</strong> Review the parsed data and make corrections in the edit page after saving.
            </div>
          </div>

          <div style={{ padding: '12px 20px', background: '#fdf6ec', display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, background: '#C1440E', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 0', fontWeight: 700, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save Recipe'}
            </button>
            <button
              onClick={() => { setParsed(null); setPreview(null) }}
              style={{
                background: '#fff', border: '1.5px solid #ddd', borderRadius: 10,
                padding: '10px 16px', cursor: 'pointer', fontSize: 14,
              }}
            >
              Re-scan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
