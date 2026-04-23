/**
 * Seed: Korean-Mexican Fusion Dinner Plan
 * Run: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SEED_USER_ID=... npx tsx supabase/seed_dinner_plan.ts
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const RECIPES = [
  {
    name:         'Sesame Cucumber Bites',
    cuisine:      'Asian',
    meal_type:    'dinner',
    emoji:        '🥢',
    tag:          'No Cook',
    description:  'Thinly sliced cucumbers tossed with sesame oil, rice vinegar, soy sauce, a pinch of sugar, and red pepper flakes. Top with sesame seeds. Done.',
    tip:          'Make this first — it gets better as it sits.',
    cook_time:    '0 min',
    prep_time:    '5 min',
    is_gf:        false,
    instructions: [
      'Thinly slice English cucumbers (a mandoline makes this fast).',
      'Whisk together sesame oil, rice vinegar, soy sauce, sugar, and red pepper flakes.',
      'Toss cucumbers in dressing. Let sit at least 10 minutes.',
      'Top with sesame seeds before serving.',
    ],
    ingredients: [
      { name: 'English cucumbers', quantity: 2, unit: 'whole', category: 'Produce',
        macros: { p: 0.7, c: 3.6, f: 0.1, kcal: 16 }, is_gf: true },
      { name: 'Sesame oil', quantity: 2, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 4.5, kcal: 40 }, is_gf: true },
      { name: 'Rice vinegar', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 0, kcal: 3 }, is_gf: true },
      { name: 'Soy sauce', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 }, is_gf: false,
        gf_swap: 'tamari (GF)', swap_macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 } },
      { name: 'Sugar', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 4.2, f: 0, kcal: 16 }, is_gf: true },
      { name: 'Red pepper flakes', quantity: 0.25, unit: 'tsp', category: 'Pantry',
        macros: { p: 0.1, c: 0.3, f: 0.1, kcal: 2 }, is_gf: true },
      { name: 'Sesame seeds', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0.5, c: 0.7, f: 1.4, kcal: 17 }, is_gf: true },
    ],
  },
  {
    name:         'Gochujang Crispy Chicken Tacos',
    cuisine:      'Korean',
    meal_type:    'dinner',
    emoji:        '🌶️',
    tag:          'Air Fryer',
    description:  'Boneless thighs tossed in a gochujang-honey-garlic glaze, air fried until crispy, then sliced for tacos. Serve with warm tortillas and all the toppings.',
    tip:          'Thighs are key — they stay juicy at high heat. 400°F for 18–20 min, flipping once.',
    cook_time:    '20 min',
    prep_time:    '10 min',
    is_gf:        false,
    instructions: [
      'Mix gochujang, honey, soy sauce, minced garlic, and sesame oil into a glaze.',
      'Toss chicken thighs in glaze and let sit 30 min if time allows.',
      'Air fry at 400°F for 18–20 min, flipping once halfway.',
      'Rest 5 min, then slice into strips.',
      'Serve in warm tortillas with cabbage, avocado, lime crema, jalapeños, and cilantro.',
    ],
    ingredients: [
      { name: 'Boneless skinless chicken thighs', quantity: 6, unit: 'oz', category: 'Proteins',
        macros: { p: 7.0, c: 0, f: 2.4, kcal: 49 }, is_gf: true },
      { name: 'Gochujang paste', quantity: 3, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0.5, c: 3.0, f: 0.3, kcal: 16 }, is_gf: false,
        gf_swap: 'GF gochujang or sriracha + white miso',
        swap_macros: { p: 0.3, c: 2.5, f: 0.2, kcal: 13 } },
      { name: 'Honey', quantity: 2, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0, c: 5.8, f: 0, kcal: 21 }, is_gf: true },
      { name: 'Soy sauce', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 }, is_gf: false,
        gf_swap: 'tamari (GF)', swap_macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 } },
      { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce',
        macros: { p: 0.2, c: 1.0, f: 0, kcal: 5 }, is_gf: true },
      { name: 'Sesame oil', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 4.5, kcal: 40 }, is_gf: true },
      { name: 'Flour tortillas', quantity: 2, unit: 'small', category: 'Grains & Frozen',
        macros: { p: 2.0, c: 13.0, f: 1.5, kcal: 73 }, is_gf: false,
        gf_swap: 'GF corn tortilla', swap_macros: { p: 1.0, c: 11.0, f: 0.5, kcal: 53 } },
    ],
  },
  {
    name:         'Mango-Cabbage Slaw',
    cuisine:      'Mexican',
    meal_type:    'dinner',
    emoji:        '🥗',
    tag:          'No Cook',
    description:  'Shredded purple cabbage, diced mango, red onion, and cilantro in a lime-honey dressing. Bright, crunchy, and bridges both cuisines perfectly.',
    tip:          'Double as a taco topping — it\'s great in the taco too.',
    cook_time:    '0 min',
    prep_time:    '10 min',
    is_gf:        true,
    instructions: [
      'Shred purple cabbage and thinly slice red onion.',
      'Dice mango into small cubes.',
      'Whisk lime juice and honey together for dressing.',
      'Toss cabbage, mango, onion, and cilantro with dressing.',
      'Season with salt. Serve immediately or refrigerate up to 2 hours.',
    ],
    ingredients: [
      { name: 'Purple cabbage', quantity: 2, unit: 'cups', category: 'Produce',
        macros: { p: 1.0, c: 5.5, f: 0.1, kcal: 25 }, is_gf: true },
      { name: 'Mango', quantity: 1, unit: 'whole', category: 'Produce',
        macros: { p: 1.4, c: 25, f: 0.6, kcal: 101 }, is_gf: true },
      { name: 'Red onion', quantity: 0.25, unit: 'whole', category: 'Produce',
        macros: { p: 0.3, c: 2.5, f: 0, kcal: 11 }, is_gf: true },
      { name: 'Cilantro', quantity: 0.25, unit: 'cup', category: 'Produce',
        macros: { p: 0.1, c: 0.1, f: 0, kcal: 1 }, is_gf: true },
      { name: 'Lime juice', quantity: 2, unit: 'whole', category: 'Produce',
        macros: { p: 0, c: 2.6, f: 0, kcal: 10 }, is_gf: true },
      { name: 'Honey', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0, c: 5.8, f: 0, kcal: 21 }, is_gf: true },
    ],
  },
  {
    name:         'Mochi Ice Cream + Tajín Chocolate',
    cuisine:      'Japanese',
    meal_type:    'dinner',
    emoji:        '🍫',
    tag:          'No Cook',
    description:  'Buy mochi ice cream (any Asian grocery or Trader\'s) and a good dark chocolate bar. Sprinkle Tajín on chocolate squares. Surprisingly perfect together.',
    tip:          'Set out 30 min before serving so mochi softens slightly.',
    cook_time:    '0 min',
    prep_time:    '0 min',
    is_gf:        false,
    instructions: [
      'Remove mochi ice cream from freezer 30 minutes before serving.',
      'Break chocolate bar into squares on a small plate.',
      'Sprinkle Tajín lightly over chocolate squares.',
      'Serve mochi alongside chocolate.',
    ],
    ingredients: [
      { name: 'Mochi ice cream', quantity: 2, unit: 'pieces', category: 'Grains & Frozen',
        macros: { p: 1.0, c: 16, f: 3.5, kcal: 100 }, is_gf: false },
      { name: 'Dark chocolate (70%+)', quantity: 1, unit: 'oz', category: 'Pantry',
        macros: { p: 1.6, c: 13, f: 8.5, kcal: 170 }, is_gf: true },
      { name: 'Tajín seasoning', quantity: 0.5, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 0.5, f: 0, kcal: 2 }, is_gf: true },
    ],
  },
]

async function seed() {
  const USER_ID = process.env.SEED_USER_ID
  if (!USER_ID) { console.error('Set SEED_USER_ID'); process.exit(1) }

  let seeded = 0
  for (const { ingredients, ...recipeData } of RECIPES) {
    const { data: existing } = await supabase.schema('recipes').from('recipes')
      .select('id').eq('user_id', USER_ID).eq('name', recipeData.name).maybeSingle()
    if (existing) { console.log(`  skip  ${recipeData.name}`); continue }

    const { data: recipe, error: recipeErr } = await supabase.schema('recipes')
      .from('recipes').insert({ ...recipeData, user_id: USER_ID }).select().single()
    if (recipeErr) { console.error(`  error ${recipeData.name}:`, recipeErr.message); continue }

    const rows = ingredients.map((ing, i) => ({ ...ing, recipe_id: (recipe as { id: string }).id, sort_order: i }))
    const { error: ingErr } = await supabase.schema('recipes').from('ingredients').insert(rows)
    if (ingErr) { console.error(`  error ingredients:`, ingErr.message); continue }

    console.log(`  seeded ${recipeData.emoji} ${recipeData.name}`)
    seeded++
  }
  console.log(`\nDone — ${seeded} recipes seeded.`)
}

seed()
