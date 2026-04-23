import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, ingredients, cuisine, tag } = await req.json()
  if (!name) return NextResponse.json({ error: 'Recipe name required' }, { status: 400 })

  const prompt = `Write clear, practical cooking instructions for this recipe.

Recipe: ${name}
${cuisine ? `Cuisine: ${cuisine}` : ''}
${tag ? `Cooking method/equipment: ${tag}` : ''}
${ingredients?.length ? `Ingredients: ${ingredients.map((i: { name: string; quantity?: string; unit?: string }) => `${i.quantity ? i.quantity + ' ' : ''}${i.unit ? i.unit + ' ' : ''}${i.name}`).join(', ')}` : ''}

Return ONLY a JSON array of instruction strings — no markdown, no explanation, no extra keys.
Each step should be a complete, actionable sentence. Aim for 4–8 steps.
Example: ["Preheat oven to 400°F.", "Season chicken with salt and pepper.", ...]`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw  = message.content[0].type === 'text' ? message.content[0].text : ''
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let instructions: string[]
  try {
    instructions = JSON.parse(json)
  } catch {
    return NextResponse.json({ error: 'Failed to parse instructions' }, { status: 422 })
  }

  return NextResponse.json({ instructions })
}
