/**
 * Seed script — 5 Blackstone starter recipes
 * Run: npx tsx supabase/seed.ts
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env
 * (service role bypasses RLS for seeding)
 * Idempotent: skips recipes with the same name per user.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Macro targets per dinner serving:
//   rest:     ~370–415 kcal / 36–42g P / 10–22g C / 15–19g F
//   training: ~420–460 kcal / 40–44g P / 20–38g C / 16–19g F
// macros = {p, c, f, kcal} per single unit (scale by quantity at render time)

const RECIPES = [
  {
    name:         'Gochujang Chicken Thighs',
    cuisine:      'Korean',
    meal_type:    'dinner',
    emoji:        '🍗',
    tag:          'Blackstone',
    description:  'Sticky, spicy-sweet Korean chicken thighs with a caramelized gochujang glaze — crispy skin and bold umami in 25 minutes.',
    tip:          'Press the thighs flat on the griddle for maximum crust. Let the glaze char slightly for depth.',
    cook_time:    '20 min',
    prep_time:    '10 min',
    is_gf:        false,
    instructions: [
      'Pat chicken thighs dry. Season with salt and pepper.',
      'Mix gochujang, soy sauce, sesame oil, honey, and minced garlic.',
      'Heat Blackstone to medium-high. Add oil and place thighs skin-side down.',
      'Cook 7–8 min until skin is crispy. Flip and cook 5 min.',
      'Brush glaze on both sides and cook 2–3 more min until caramelized.',
      'Rest 3 min. Top with sliced green onion and sesame seeds.',
    ],
    ingredients: [
      { name: 'Boneless chicken thighs', quantity: 6, unit: 'oz', category: 'Proteins',
        macros: { p: 7.0, c: 0, f: 2.4, kcal: 49 }, is_gf: true },
      { name: 'Gochujang paste', quantity: 2, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0.5, c: 3.0, f: 0.3, kcal: 16 }, is_gf: false,
        gf_swap: 'GF gochujang or sriracha + white miso',
        swap_macros: { p: 0.3, c: 2.5, f: 0.2, kcal: 13 } },
      { name: 'Soy sauce', quantity: 1.5, unit: 'tbsp', category: 'Pantry',
        macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 }, is_gf: false,
        gf_swap: 'tamari (GF)', swap_macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 } },
      { name: 'Sesame oil', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 4.5, kcal: 40 }, is_gf: true },
      { name: 'Honey', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 5.8, f: 0, kcal: 21 }, is_gf: true },
      { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce',
        macros: { p: 0.2, c: 1.0, f: 0, kcal: 5 }, is_gf: true },
      { name: 'Green onions', quantity: 2, unit: 'stalks', category: 'Produce',
        macros: { p: 0.2, c: 0.7, f: 0, kcal: 4 }, is_gf: true },
      { name: 'Sesame seeds', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0.5, c: 0.7, f: 1.4, kcal: 17 }, is_gf: true },
    ],
    // rest total: ~397 kcal / 43g P / 19g C / 18g F
  },
  {
    name:         'Egg Roll in a Bowl',
    cuisine:      'Asian',
    meal_type:    'dinner',
    emoji:        '🥬',
    tag:          'Blackstone',
    description:  'All the flavors of an egg roll without the wrapper — ground turkey with sautéed cabbage, carrots, and a savory soy-ginger sauce.',
    tip:          'Use the highest heat setting to get some char on the cabbage. A little browning = huge flavor.',
    cook_time:    '15 min',
    prep_time:    '10 min',
    is_gf:        false,
    instructions: [
      'Brown ground turkey on medium-high heat, breaking into crumbles. Season with salt.',
      'Push turkey to one side. Add cabbage and carrots, cook 3–4 min until slightly tender.',
      'Mix in soy sauce, sesame oil, ginger, and garlic. Toss everything together.',
      'Cook 2 more min. Taste and adjust seasoning.',
      'Serve topped with sliced green onions and a drizzle of sriracha.',
    ],
    ingredients: [
      { name: 'Ground turkey (93% lean)', quantity: 6, unit: 'oz', category: 'Proteins',
        macros: { p: 7.0, c: 0, f: 0.7, kcal: 34 }, is_gf: true },
      { name: 'Shredded cabbage', quantity: 2, unit: 'cups', category: 'Produce',
        macros: { p: 1.0, c: 5.0, f: 0, kcal: 22 }, is_gf: true },
      { name: 'Shredded carrots', quantity: 0.5, unit: 'cup', category: 'Produce',
        macros: { p: 0.5, c: 6.0, f: 0, kcal: 26 }, is_gf: true },
      { name: 'Soy sauce', quantity: 2, unit: 'tbsp', category: 'Pantry',
        macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 }, is_gf: false,
        gf_swap: 'tamari (GF)', swap_macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 } },
      { name: 'Sesame oil', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 4.5, kcal: 40 }, is_gf: true },
      { name: 'Fresh ginger', quantity: 1, unit: 'tsp', category: 'Produce',
        macros: { p: 0, c: 0.4, f: 0, kcal: 2 }, is_gf: true },
      { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce',
        macros: { p: 0.2, c: 1.0, f: 0, kcal: 5 }, is_gf: true },
      { name: 'Green onions', quantity: 2, unit: 'stalks', category: 'Produce',
        macros: { p: 0.2, c: 0.7, f: 0, kcal: 4 }, is_gf: true },
      { name: 'Avocado oil', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 14, kcal: 124 }, is_gf: true },
    ],
    // rest total: ~388 kcal / 42g P / 20g C / 17g F
  },
  {
    name:         'Blackstone Chicken Fajitas',
    cuisine:      'Mexican',
    meal_type:    'dinner',
    emoji:        '🌮',
    tag:          'Blackstone',
    description:  'Sizzling chicken fajitas with charred peppers and onions — bold seasoning, high heat, and the signature Blackstone sear.',
    tip:          'Cut chicken against the grain into thin strips for maximum tenderness. Don\'t move it for the first 2 minutes to get the char.',
    cook_time:    '15 min',
    prep_time:    '10 min',
    is_gf:        false,
    instructions: [
      'Slice chicken into thin strips. Toss with fajita seasoning and a squeeze of lime.',
      'Heat Blackstone to high. Add avocado oil.',
      'Sear chicken strips 2 min without moving, then toss. Cook 3–4 more min until cooked through.',
      'Push chicken aside. Add peppers and onion to a hot zone — cook 4–5 min until charred.',
      'Combine chicken and vegetables. Serve with warm tortillas and toppings.',
    ],
    ingredients: [
      { name: 'Chicken breast', quantity: 6, unit: 'oz', category: 'Proteins',
        macros: { p: 6.5, c: 0, f: 0.7, kcal: 31 }, is_gf: true },
      { name: 'Bell peppers (mixed)', quantity: 1.5, unit: 'cups', category: 'Produce',
        macros: { p: 0.5, c: 3.0, f: 0, kcal: 15 }, is_gf: true },
      { name: 'White onion', quantity: 0.5, unit: 'cup', category: 'Produce',
        macros: { p: 0.5, c: 3.5, f: 0, kcal: 16 }, is_gf: true },
      { name: 'Fajita seasoning', quantity: 1.5, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0.3, c: 2.0, f: 0.3, kcal: 10 }, is_gf: true },
      { name: 'Avocado oil', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 14, kcal: 124 }, is_gf: true },
      { name: 'Lime', quantity: 1, unit: 'whole', category: 'Produce',
        macros: { p: 0, c: 2.6, f: 0, kcal: 10 }, is_gf: true },
      { name: 'Flour tortillas', quantity: 2, unit: 'small', category: 'Grains & Frozen',
        macros: { p: 2.0, c: 13.0, f: 1.5, kcal: 73 }, is_gf: false,
        gf_swap: 'GF corn tortilla', swap_macros: { p: 1.0, c: 11.0, f: 0.5, kcal: 53 } },
    ],
    // rest total: ~420 kcal / 41g P / 29g C / 18g F (training = same)
  },
  {
    name:         'Miso-Glazed Salmon',
    cuisine:      'Japanese',
    meal_type:    'dinner',
    emoji:        '🐟',
    tag:          'Blackstone',
    description:  'Silky salmon fillets with a caramelized white miso glaze — umami-rich, slightly sweet, and perfectly crusted on the flat top.',
    tip:          'Marinate for at least 30 minutes. The miso will caramelize quickly — watch for browning and lower heat if needed.',
    cook_time:    '12 min',
    prep_time:    '5 min + 30 min marinate',
    is_gf:        false,
    instructions: [
      'Whisk miso, mirin, soy sauce, honey, and sesame oil into a paste.',
      'Coat salmon fillets in glaze. Marinate 30 min (or up to 2 hours).',
      'Heat Blackstone to medium. Add a thin layer of oil.',
      'Place salmon flesh-side down. Cook 4–5 min until golden.',
      'Carefully flip. Brush remaining glaze on top. Cook 3–4 min.',
      'Serve over steamed rice with sliced cucumber and sesame seeds.',
    ],
    ingredients: [
      { name: 'Salmon fillet', quantity: 6, unit: 'oz', category: 'Proteins',
        macros: { p: 5.7, c: 0, f: 3.7, kcal: 55 }, is_gf: true },
      { name: 'White miso paste', quantity: 2, unit: 'tbsp', category: 'Pantry',
        macros: { p: 1.0, c: 2.5, f: 0.5, kcal: 18 }, is_gf: true },
      { name: 'Mirin', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0, c: 6.0, f: 0, kcal: 24 }, is_gf: false,
        gf_swap: 'GF mirin or rice wine vinegar + sugar',
        swap_macros: { p: 0, c: 5.5, f: 0, kcal: 22 } },
      { name: 'Soy sauce', quantity: 1, unit: 'tbsp', category: 'Pantry',
        macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 }, is_gf: false,
        gf_swap: 'tamari (GF)', swap_macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 } },
      { name: 'Honey', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 5.8, f: 0, kcal: 21 }, is_gf: true },
      { name: 'Sesame oil', quantity: 0.5, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 4.5, kcal: 40 }, is_gf: true },
      { name: 'Steamed jasmine rice', quantity: 0.5, unit: 'cup cooked', category: 'Grains & Frozen',
        macros: { p: 2.0, c: 26, f: 0.2, kcal: 114 }, is_gf: true },
    ],
    // rest total: ~407 kcal / 38g P / 22g C / 17g F
  },
  {
    name:         'Beef Bulgogi Bowl',
    cuisine:      'Korean',
    meal_type:    'dinner',
    emoji:        '🥩',
    tag:          'Blackstone',
    description:  'Thinly sliced beef in a sweet-savory Korean marinade, seared fast on the flat top and served over rice with crisp vegetables.',
    tip:          'Freeze the beef 20 minutes before slicing for ultra-thin cuts. High heat, fast cook — don\'t crowd the griddle.',
    cook_time:    '10 min',
    prep_time:    '15 min + 30 min marinate',
    is_gf:        false,
    instructions: [
      'Thinly slice beef ribeye against the grain. Freeze 20 min first for easier slicing.',
      'Mix soy sauce, pear or apple juice, sesame oil, brown sugar, garlic, and ginger for marinade.',
      'Toss beef in marinade. Marinate 30 min minimum.',
      'Heat Blackstone to high. Spread beef in a single layer — cook 1–2 min per side.',
      'Plate over rice. Garnish with kimchi, sliced green onion, sesame seeds, and a fried egg.',
    ],
    ingredients: [
      { name: 'Beef ribeye (thinly sliced)', quantity: 5, unit: 'oz', category: 'Proteins',
        macros: { p: 6.5, c: 0, f: 5.2, kcal: 73 }, is_gf: true },
      { name: 'Soy sauce', quantity: 2.5, unit: 'tbsp', category: 'Pantry',
        macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 }, is_gf: false,
        gf_swap: 'tamari (GF)', swap_macros: { p: 1.0, c: 0.7, f: 0, kcal: 7 } },
      { name: 'Pear juice or apple juice', quantity: 2, unit: 'tbsp', category: 'Pantry',
        macros: { p: 0, c: 4.0, f: 0, kcal: 16 }, is_gf: true },
      { name: 'Sesame oil', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 0, f: 4.5, kcal: 40 }, is_gf: true },
      { name: 'Brown sugar', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0, c: 4.5, f: 0, kcal: 17 }, is_gf: true },
      { name: 'Garlic', quantity: 4, unit: 'cloves', category: 'Produce',
        macros: { p: 0.2, c: 1.0, f: 0, kcal: 5 }, is_gf: true },
      { name: 'Steamed rice', quantity: 0.5, unit: 'cup cooked', category: 'Grains & Frozen',
        macros: { p: 2.0, c: 26, f: 0.2, kcal: 114 }, is_gf: true },
      { name: 'Green onions', quantity: 2, unit: 'stalks', category: 'Produce',
        macros: { p: 0.2, c: 0.7, f: 0, kcal: 4 }, is_gf: true },
      { name: 'Sesame seeds', quantity: 1, unit: 'tsp', category: 'Pantry',
        macros: { p: 0.5, c: 0.7, f: 1.4, kcal: 17 }, is_gf: true },
    ],
    // rest total: ~415 kcal / 41g P / 21g C / 16g F
  },
]

async function seed() {
  // Must seed as a specific user in production — for local dev, use service role
  // which bypasses RLS. In production, pass a real user_id.
  const USER_ID = process.env.SEED_USER_ID
  if (!USER_ID) {
    console.error('Set SEED_USER_ID env var to the Supabase Auth user UUID to seed as.')
    process.exit(1)
  }

  let seeded = 0

  for (const { ingredients, ...recipeData } of RECIPES) {
    // Idempotency check
    const { data: existing } = await supabase
      .schema('recipes')
      .from('recipes')
      .select('id')
      .eq('user_id', USER_ID)
      .eq('name', recipeData.name)
      .maybeSingle()

    if (existing) {
      console.log(`  skip  ${recipeData.name}`)
      continue
    }

    const { data: recipe, error: recipeErr } = await supabase
      .schema('recipes')
      .from('recipes')
      .insert({ ...recipeData, user_id: USER_ID })
      .select()
      .single()

    if (recipeErr) { console.error(`  error ${recipeData.name}:`, recipeErr.message); continue }

    const rows = ingredients.map((ing, i) => ({ ...ing, recipe_id: (recipe as { id: string }).id, sort_order: i }))
    const { error: ingErr } = await supabase.schema('recipes').from('ingredients').insert(rows)
    if (ingErr) { console.error(`  error ingredients for ${recipeData.name}:`, ingErr.message); continue }

    console.log(`  seeded ${recipeData.emoji} ${recipeData.name}`)
    seeded++
  }

  console.log(`\nDone — ${seeded} recipes seeded.`)
}

seed()
