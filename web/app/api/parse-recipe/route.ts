import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

const VISION_PROMPT = `You are a recipe parser. Parse the recipe in this image into JSON.
Return ONLY valid JSON — no markdown, no backticks, no explanation.
Required fields:
  name (string), cuisine (string — one of: Korean/Mexican/Japanese/Asian/Mediterranean/Other),
  meal_type (breakfast|lunch|dinner),
  description (string — 1-2 sentences), tip (string — one actionable tip),
  cook_time (string — e.g. "20 min"), prep_time (string — e.g. "10 min"),
  emoji (single emoji), tag (string — e.g. Blackstone/Air Fryer/No Cook),
  instructions (string[] — ordered steps, each a complete sentence),
  is_gf (boolean — true only if ALL ingredients are GF or have easy GF swaps),
  ingredients: [{
    name (string),
    quantity (number | null),
    unit (string | null — cup/oz/tbsp/g/tsp/lb/cloves/etc),
    category (string — one of: Proteins/Produce/Pantry/Grains & Frozen/Dairy),
    macros: { p: number, c: number, f: number, kcal: number } (per single unit — estimate from standard nutritional data),
    is_gf (boolean — false if this specific ingredient needs a GF swap),
    gf_swap (string | null — GF alternative ingredient name, or null if already GF)
  }]
If a field cannot be determined from the image, use null.
Estimate macros from standard nutritional data if not shown.`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  // Upload to Supabase Storage
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: uploadError } = await supabase.storage
    .from('recipe-screenshots')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  // Non-fatal if bucket doesn't exist yet — continue with parse
  const source_image_url = uploadError ? null : path

  // Convert to base64 for Claude Vision
  const base64 = buffer.toString('base64')
  const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp') || 'image/jpeg'

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        { type: 'text',  text: VISION_PROMPT },
      ],
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''

  // Strip any accidental markdown fences
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let recipe: unknown
  try {
    recipe = JSON.parse(json)
  } catch {
    return NextResponse.json({ error: 'Failed to parse recipe JSON', raw }, { status: 422 })
  }

  return NextResponse.json({ recipe, source_image_url })
}
