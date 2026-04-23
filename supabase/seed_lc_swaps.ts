/**
 * Backfills lc_swap + lc_swap_macros on ingredients that have a known low-carb swap.
 * Run after migration 005.
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// name pattern → { lc_swap, lc_swap_macros per same unit }
const LC_SWAP_MAP: Record<string, { lc_swap: string; lc_swap_macros: { p: number; c: number; f: number; kcal: number } }> = {
  'steamed jasmine rice':  { lc_swap: 'cauliflower rice', lc_swap_macros: { p: 1.0, c: 5.0, f: 0.1, kcal: 25 } },
  'steamed rice':          { lc_swap: 'cauliflower rice', lc_swap_macros: { p: 1.0, c: 5.0, f: 0.1, kcal: 25 } },
  'flour tortillas':       { lc_swap: 'butter lettuce wrap', lc_swap_macros: { p: 0.3, c: 0.5, f: 0.1, kcal: 4 } },
  'brown sugar':           { lc_swap: 'monk fruit sweetener', lc_swap_macros: { p: 0, c: 0, f: 0, kcal: 0 } },
  'honey':                 { lc_swap: 'sugar-free honey syrup', lc_swap_macros: { p: 0, c: 1.0, f: 0, kcal: 5 } },
  'mirin':                 { lc_swap: 'dry sherry + 1/4 tsp sweetener', lc_swap_macros: { p: 0, c: 1.5, f: 0, kcal: 8 } },
  'pear juice or apple juice': { lc_swap: 'unsweetened pear juice (small amount)', lc_swap_macros: { p: 0, c: 1.5, f: 0, kcal: 6 } },
}

async function backfill() {
  const { data: ingredients, error } = await supabase
    .schema('recipes')
    .from('ingredients')
    .select('id, name')

  if (error) { console.error('fetch error:', error.message); process.exit(1) }

  let updated = 0
  for (const ing of ingredients ?? []) {
    const key = ing.name.toLowerCase()
    const swap = LC_SWAP_MAP[key]
    if (!swap) continue

    const { error: updateErr } = await supabase
      .schema('recipes')
      .from('ingredients')
      .update({ lc_swap: swap.lc_swap, lc_swap_macros: swap.lc_swap_macros })
      .eq('id', ing.id)

    if (updateErr) { console.error(`  error ${ing.name}:`, updateErr.message); continue }
    console.log(`  ✓ ${ing.name} → ${swap.lc_swap}`)
    updated++
  }

  console.log(`\nDone — ${updated} ingredients updated.`)
}

backfill()
