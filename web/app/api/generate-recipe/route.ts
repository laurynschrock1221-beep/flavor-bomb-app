import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ingredients, flavorProfile, mealType, isGF, isLC } = await req.json()

  if (!ingredients?.trim()) {
    return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 })
  }

  // Load user's equipment preferences
  const { data: equipmentRow } = await (supabase as any).schema('recipes').from('user_equipment')
    .select('equipment').eq('user_id', user.id).maybeSingle()
  const equipment: string[] = equipmentRow?.equipment ?? []

  const EQUIPMENT_LABELS: Record<string, string> = {
    blackstone: 'Blackstone flat-top griddle', air_fryer: 'air fryer',
    oven: 'oven', stovetop: 'stovetop', instant_pot: 'Instant Pot',
    slow_cooker: 'slow cooker', grill: 'outdoor grill',
    sous_vide: 'sous vide', microwave: 'microwave', no_cook: 'no-cook methods',
  }

  const constraints = [
    isGF && 'gluten-free (use tamari instead of soy sauce, GF alternatives throughout)',
    isLC && 'low carb (swap rice for cauliflower rice, tortillas for lettuce wraps, minimize sugar)',
  ].filter(Boolean).join(' and ')

  const equipmentContext = equipment.length
    ? `Equipment available: ${equipment.map(e => EQUIPMENT_LABELS[e] ?? e).join(', ')}. Prefer using this equipment in the method.`
    : ''

  const prompt = `You are a creative chef and nutritionist. Create a single delicious recipe using these ingredients the user has on hand.

Ingredients available: ${ingredients}
${flavorProfile ? `Flavor profile / cuisine vibe: ${flavorProfile}` : ''}
${mealType ? `Meal type: ${mealType}` : ''}
${constraints ? `Dietary requirements: ${constraints}` : ''}
${equipmentContext}

Rules:
- Use mostly the ingredients listed. You may add common pantry staples (salt, pepper, oil, garlic, basic spices) but keep additions minimal.
- Make it practical and delicious — write it like a confident chef sharing their go-to recipe.
- The tip should be genuinely useful (technique, timing, a trick that makes it better).
- Estimate macros per single unit of each ingredient from standard nutritional data.
${isGF ? '- Mark is_gf false on any ingredient that contains gluten, and provide a gf_swap.' : ''}
${isLC ? '- Add lc_swap for any high-carb ingredient (rice, bread, tortillas, pasta, sugar, etc).' : ''}

Return ONLY valid JSON — no markdown, no backticks, no explanation.
Schema:
{
  "name": string,
  "cuisine": string (Korean|Mexican|Japanese|Asian|Mediterranean|Other),
  "meal_type": string[] (any of: breakfast|lunch|dinner|snack|side),
  "description": string (1-2 punchy sentences),
  "tip": string (one actionable pro tip),
  "cook_time": string (e.g. "20 min"),
  "prep_time": string (e.g. "10 min"),
  "emoji": string (single emoji),
  "tag": string (e.g. Air Fryer|Blackstone|No Cook|One Pan|30 min),
  "is_gf": boolean,
  "instructions": string[] (ordered steps, each a complete sentence),
  "ingredients": [{
    "name": string,
    "quantity": number | null,
    "unit": string | null,
    "category": string (Proteins|Produce|Pantry|Grains & Frozen|Dairy),
    "macros": { "p": number, "c": number, "f": number, "kcal": number },
    "is_gf": boolean,
    "gf_swap": string | null,
    "swap_macros": object | null,
    "lc_swap": string | null,
    "lc_swap_macros": object | null
  }]
}`

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

  let recipe: unknown
  try {
    recipe = JSON.parse(json)
  } catch {
    return NextResponse.json({ error: 'Failed to parse recipe JSON', raw }, { status: 422 })
  }

  return NextResponse.json({ recipe })
}
