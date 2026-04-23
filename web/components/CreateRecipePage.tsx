'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { recipesDb } from '@flavor-bomb/shared'
import type { Recipe, Ingredient, MealType, MacroSet } from '@flavor-bomb/shared'

const FLAVOR_PROFILES = [
  'Korean', 'Mexican', 'Japanese', 'Asian fusion', 'Mediterranean',
  'Bold & spicy', 'Light & fresh', 'Comfort food', 'High protein', 'Quick & easy',
]
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'side']
const CUISINES = ['Korean', 'Mexican', 'Japanese', 'Asian', 'Mediterranean', 'Other']
const CATEGORIES = ['Proteins', 'Produce', 'Pantry', 'Grains & Frozen', 'Dairy']

type ParsedRecipe = Omit<Recipe,'id'|'user_id'|'created_at'|'updated_at'> & {
  ingredients: Omit<Ingredient,'id'|'recipe_id'|'created_at'>[]
}

type ManualIngredient = { name: string; quantity: string; unit: string; category: string }

const blankIngredient = (): ManualIngredient => ({ name: '', quantity: '', unit: '', category: 'Pantry' })

export default function CreateRecipePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

  // ── AI mode state ────────────────────────────────────────────
  const [aiIngredients, setAiIngredients] = useState('')
  const [flavors,        setFlavors]       = useState<string[]>([])
  const [customFlavor,   setCustomFlavor]  = useState('')
  const [aiMealType,     setAiMealType]    = useState('')
  const [aiGF,           setAiGF]          = useState(false)
  const [aiLC,           setAiLC]          = useState(false)
  const [generating,     setGenerating]    = useState(false)
  const [parsed,         setParsed]        = useState<ParsedRecipe | null>(null)

  // ── Manual mode state ────────────────────────────────────────
  const [name,         setName]         = useState('')
  const [cuisine,      setCuisine]      = useState('')
  const [mealTypes,    setMealTypes]    = useState<MealType[]>([])
  const [description,  setDescription]  = useState('')
  const [tip,          setTip]          = useState('')
  const [prepTime,     setPrepTime]     = useState('')
  const [cookTime,     setCookTime]     = useState('')
  const [emoji,        setEmoji]        = useState('')
  const [tag,          setTag]          = useState('')
  const [servings,     setServings]     = useState('1')
  const [manualGF,     setManualGF]     = useState(false)
  const [instructions, setInstructions] = useState([''])
  const [manualIngs,   setManualIngs]   = useState<ManualIngredient[]>([blankIngredient()])

  // ── Shared ───────────────────────────────────────────────────
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)
  const [inferringSteps,   setInferringSteps]   = useState(false)

  async function handleInferInstructions() {
    if (!name.trim()) { setError('Add a recipe name first'); return }
    setInferringSteps(true); setError(null)
    const res = await fetch('/api/infer-instructions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ingredients: manualIngs.filter(i => i.name.trim()), cuisine, tag }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed'); setInferringSteps(false); return }
    setInstructions(json.instructions)
    setInferringSteps(false)
  }

  function toggleFlavor(f: string) {
    setFlavors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  // ── AI generate ──────────────────────────────────────────────
  async function handleGenerate() {
    if (!aiIngredients.trim()) return
    setGenerating(true); setError(null); setParsed(null)
    const res  = await fetch('/api/generate-recipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ingredients: aiIngredients,
        flavorProfile: [...flavors, customFlavor].filter(Boolean).join(', '),
        mealType: aiMealType, isGF: aiGF, isLC: aiLC,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Generation failed'); setGenerating(false); return }
    setParsed(json.recipe)
    setGenerating(false)
  }

  async function saveRecipe(recipe: ParsedRecipe) {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setSaving(false); return }
    const { ingredients: ings, ...recipeData } = recipe
    const { data: newRecipe, error: recipeErr } = await recipesDb(supabase)
      .from('recipes').insert({ ...recipeData, user_id: user.id }).select().single()
    if (recipeErr) { setError(recipeErr.message); setSaving(false); return }
    if (ings?.length) {
      const rows = ings.map((ing, i) => ({ ...ing, recipe_id: (newRecipe as Recipe).id, sort_order: i }))
      await recipesDb(supabase).from('ingredients').insert(rows)
    }
    router.push('/recipes')
  }

  // ── Manual save ──────────────────────────────────────────────
  async function handleManualSave() {
    if (!name.trim()) { setError('Recipe name is required'); return }
    setSaving(true); setError(null)

    const filteredIngs = manualIngs.filter(i => i.name.trim())

    // Estimate macros via AI
    let estimatedMacros: { p: number; c: number; f: number; kcal: number }[] = []
    try {
      const res = await fetch('/api/estimate-macros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: filteredIngs }),
      })
      const json = await res.json()
      if (res.ok) estimatedMacros = json.macros ?? []
    } catch { /* non-fatal — save with null macros */ }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recipe = {
      name: name.trim(),
      cuisine: cuisine || null,
      meal_type: mealTypes.length ? mealTypes : null,
      description: description || null,
      tip: tip || null,
      prep_time: prepTime || null,
      cook_time: cookTime || null,
      emoji: emoji || null,
      tag: tag || null,
      servings: parseInt(servings) || 1,
      is_gf: manualGF,
      source_image_url: null,
      instructions: instructions.filter(s => s.trim()),
      ingredients: filteredIngs.map((i, idx) => ({
        name: i.name.trim(),
        quantity: i.quantity ? parseFloat(i.quantity) : null,
        unit: i.unit || null,
        category: i.category || null,
        macros: (estimatedMacros[idx] ?? null) as MacroSet | null,
        is_gf: true,
        gf_swap: null,
        swap_macros: null as MacroSet | null,
        lc_swap: null,
        lc_swap_macros: null as MacroSet | null,
        sort_order: idx,
      })),
    }
    await saveRecipe(recipe as ParsedRecipe)
  }

  const chipStyle = (active: boolean, color = '#C1440E') => ({
    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
    cursor: 'pointer', border: `1.5px solid ${active ? color : '#e5e0d8'}`,
    background: active ? color : '#fff', color: active ? '#fff' : '#666',
    transition: 'all 0.15s',
  } as React.CSSProperties)

  const inputStyle: React.CSSProperties = {
    width: '100%', borderRadius: 10, border: '1.5px solid #e5e0d8',
    padding: '10px 14px', fontSize: 13, background: '#fff', outline: 'none',
    fontFamily: 'DM Sans, system-ui, sans-serif', boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#555',
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Mode tabs */}
      <div style={{ display: 'flex', background: '#f0e8de', borderRadius: 12, padding: 4, marginBottom: 28, gap: 2 }}>
        {([['ai', '✨ AI Generate'], ['manual', '📝 Manual Entry']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setMode(key)} style={{
            flex: 1, border: 'none', borderRadius: 9, padding: '10px 0', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: mode === key ? '#fff' : 'transparent',
            color: mode === key ? '#1a1a1a' : '#888',
            boxShadow: mode === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: '#fff3ef', border: '1.5px solid #C1440E', borderRadius: 10, padding: '12px 16px', color: '#C1440E', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── AI MODE ──────────────────────────────────────────── */}
      {mode === 'ai' && (
        <>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>What do you have?</label>
            <textarea
              value={aiIngredients}
              onChange={e => setAiIngredients(e.target.value)}
              placeholder="e.g. chicken thighs, gochujang, sesame oil, cabbage, garlic…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Flavor profile <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {FLAVOR_PROFILES.map(f => (
                <button key={f} onClick={() => toggleFlavor(f)} style={chipStyle(flavors.includes(f))}>{f}</button>
              ))}
            </div>
            <input value={customFlavor} onChange={e => setCustomFlavor(e.target.value)}
              placeholder="Or describe your own vibe…" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Meal type <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setAiMealType(aiMealType === t ? '' : t)} style={chipStyle(aiMealType === t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <button onClick={() => setAiGF(v => !v)} style={chipStyle(aiGF, '#2C6E49')}>🌿 Gluten Free</button>
            <button onClick={() => setAiLC(v => !v)} style={chipStyle(aiLC, '#8B5E3C')}>🥦 Low Carb</button>
          </div>

          <button onClick={handleGenerate} disabled={generating || !aiIngredients.trim()} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: generating || !aiIngredients.trim() ? '#e5e0d8' : '#C1440E',
            color: generating || !aiIngredients.trim() ? '#aaa' : '#fff',
            fontSize: 15, fontWeight: 700, cursor: generating || !aiIngredients.trim() ? 'default' : 'pointer',
            transition: 'all 0.15s', marginBottom: 24,
          }}>
            {generating ? '✨ Generating…' : '✨ Generate Recipe'}
          </button>

          {parsed && !generating && (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e5e0d8', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f0eb', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 36 }}>{parsed.emoji ?? '🍽️'}</span>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700 }}>{parsed.name}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2, textTransform: 'capitalize' }}>
                    {[parsed.cuisine, Array.isArray(parsed.meal_type) ? parsed.meal_type.join(' · ') : parsed.meal_type, parsed.cook_time].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
              {parsed.description && <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, padding: '14px 20px 0', margin: 0 }}>{parsed.description}</p>}
              {parsed.tip && (
                <div style={{ margin: '12px 20px', background: '#fdf6ec', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#333' }}>
                  <span style={{ fontWeight: 700, color: '#C1440E' }}>💡 </span>{parsed.tip}
                </div>
              )}
              <div style={{ padding: '0 20px', fontSize: 12, color: '#aaa', marginBottom: 4 }}>
                {parsed.ingredients?.length ?? 0} ingredients · {parsed.instructions?.length ?? 0} steps
              </div>
              <div style={{ padding: '12px 20px 20px', display: 'flex', gap: 10 }}>
                <button onClick={() => setParsed(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e5e0d8', background: '#fff', fontSize: 13, fontWeight: 600, color: '#888', cursor: 'pointer' }}>
                  Regenerate
                </button>
                <button onClick={() => saveRecipe(parsed)} disabled={saving} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: '#C1440E', fontSize: 14, fontWeight: 700, color: '#fff', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : 'Save Recipe'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MANUAL MODE ──────────────────────────────────────── */}
      {mode === 'manual' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name + Emoji */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Recipe name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Gochujang Chicken Thighs" style={inputStyle} />
            </div>
            <div style={{ width: 80 }}>
              <label style={labelStyle}>Emoji</label>
              <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="🍗" style={{ ...inputStyle, textAlign: 'center', fontSize: 22 }} />
            </div>
          </div>

          {/* Cuisine + Tag */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cuisine</label>
              <select value={cuisine} onChange={e => setCuisine(e.target.value)} style={{ ...inputStyle, appearance: 'auto' }}>
                <option value="">Select…</option>
                {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Tag</label>
              <input value={tag} onChange={e => setTag(e.target.value)} placeholder="Blackstone / Air Fryer / No Cook…" style={inputStyle} />
            </div>
          </div>

          {/* Meal types */}
          <div>
            <label style={labelStyle}>Meal type</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MEAL_TYPES.map(t => (
                <button key={t} onClick={() => setMealTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                  style={chipStyle(mealTypes.includes(t))}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Times + Servings */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Prep time</label>
              <input value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="10 min" style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Cook time</label>
              <input value={cookTime} onChange={e => setCookTime(e.target.value)} placeholder="20 min" style={inputStyle} />
            </div>
            <div style={{ width: 80 }}>
              <label style={labelStyle}>Servings</label>
              <input type="number" min="1" value={servings} onChange={e => setServings(e.target.value)}
                placeholder="1" style={{ ...inputStyle, textAlign: 'center' }} />
            </div>
          </div>

          {/* Description + Tip */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="A 1–2 sentence description…" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={labelStyle}>Pro tip</label>
            <input value={tip} onChange={e => setTip(e.target.value)} placeholder="One actionable tip that makes this better…" style={inputStyle} />
          </div>

          {/* GF toggle */}
          <div>
            <button onClick={() => setManualGF(v => !v)} style={chipStyle(manualGF, '#2C6E49')}>🌿 Gluten Free</button>
          </div>

          {/* Instructions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Instructions</label>
              <button onClick={handleInferInstructions} disabled={inferringSteps || !name.trim()} style={{
                fontSize: 11, fontWeight: 600, color: inferringSteps ? '#aaa' : '#C1440E',
                background: 'none', border: 'none', cursor: inferringSteps || !name.trim() ? 'default' : 'pointer', padding: 0,
              }}>
                {inferringSteps ? '✨ Inferring…' : '✨ AI fill from ingredients'}
              </button>
            </div>
            {instructions.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ width: 24, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#aaa', flexShrink: 0 }}>{i + 1}.</span>
                <input
                  value={step}
                  onChange={e => setInstructions(prev => prev.map((s, j) => j === i ? e.target.value : s))}
                  placeholder={`Step ${i + 1}…`}
                  style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); setInstructions(prev => [...prev.slice(0, i + 1), '', ...prev.slice(i + 1)]) }
                  }}
                />
                {instructions.length > 1 && (
                  <button onClick={() => setInstructions(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '6px 4px' }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setInstructions(prev => [...prev, ''])}
              style={{ fontSize: 12, color: '#C1440E', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}>
              + Add step
            </button>
          </div>

          {/* Ingredients */}
          <div>
            <label style={labelStyle}>Ingredients</label>
            {manualIngs.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input value={ing.name} onChange={e => setManualIngs(prev => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                  placeholder="Ingredient" style={{ ...inputStyle, flex: 2 }} />
                <input value={ing.quantity} onChange={e => setManualIngs(prev => prev.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))}
                  placeholder="Qty" style={{ ...inputStyle, width: 60, flex: 'none' }} />
                <input value={ing.unit} onChange={e => setManualIngs(prev => prev.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))}
                  placeholder="Unit" style={{ ...inputStyle, width: 70, flex: 'none' }} />
                <select value={ing.category} onChange={e => setManualIngs(prev => prev.map((x, j) => j === i ? { ...x, category: e.target.value } : x))}
                  style={{ ...inputStyle, width: 130, flex: 'none', appearance: 'auto' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {manualIngs.length > 1 && (
                  <button onClick={() => setManualIngs(prev => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '4px' }}>×</button>
                )}
              </div>
            ))}
            <button onClick={() => setManualIngs(prev => [...prev, blankIngredient()])}
              style={{ fontSize: 12, color: '#C1440E', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontWeight: 600 }}>
              + Add ingredient
            </button>
          </div>

          <button onClick={handleManualSave} disabled={saving || !name.trim()} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: saving || !name.trim() ? '#e5e0d8' : '#1a1a1a',
            color: saving || !name.trim() ? '#aaa' : '#fff',
            fontSize: 15, fontWeight: 700, cursor: saving || !name.trim() ? 'default' : 'pointer',
            marginTop: 8,
          }}>
            {saving ? 'Saving…' : 'Save Recipe'}
          </button>
        </div>
      )}
    </div>
  )
}
