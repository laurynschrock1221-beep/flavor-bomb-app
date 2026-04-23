import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ingredients } = await req.json()
  if (!ingredients?.length) return NextResponse.json({ macros: [] })

  const list = ingredients.map((ing: { name: string; quantity?: string | null; unit?: string | null }, i: number) =>
    `${i}: ${ing.quantity ? ing.quantity + ' ' : ''}${ing.unit ? ing.unit + ' ' : ''}${ing.name}`
  ).join('\n')

  const prompt = `Estimate nutritional macros for each ingredient listed below.
Return ONLY a JSON array — one object per ingredient, same order, same count.
Each object: { "p": number, "c": number, "f": number, "kcal": number }
Values are PER SINGLE UNIT of the quantity listed (e.g. if "2 cups rice", give macros per 1 cup).
Use standard USDA nutritional data. Return numbers only, no units.

Ingredients:
${list}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw  = message.content[0].type === 'text' ? message.content[0].text : '[]'
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let macros: unknown[]
  try { macros = JSON.parse(json) }
  catch { return NextResponse.json({ error: 'Failed to parse macros' }, { status: 422 }) }

  return NextResponse.json({ macros })
}
