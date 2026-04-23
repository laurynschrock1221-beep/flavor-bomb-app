import type { Ingredient } from '../types'

export const GF_SWAP_MAP: Record<string, string> = {
  'soy sauce':           'tamari (GF)',
  'flour tortilla':      'GF corn tortilla',
  'all-purpose flour':   'GF 1:1 flour blend',
  'regular pasta':       'GF rice pasta',
  'panko breadcrumbs':   'GF breadcrumbs',
  'panko':               'GF breadcrumbs',
  'mirin':               'GF mirin or rice wine vinegar + sugar',
  'oyster sauce':        'GF oyster sauce',
  'hoisin sauce':        'GF hoisin sauce',
  'gochujang':           'GF gochujang or sriracha + white miso',
  'wheat flour':         'GF 1:1 flour blend',
  'bread crumbs':        'GF breadcrumbs',
  'pasta':               'GF rice pasta',
  'breadcrumbs':         'GF breadcrumbs',
  'teriyaki sauce':      'GF tamari + honey + garlic',
  'worcestershire':      'GF worcestershire sauce',
}

/** Auto-fills gf_swap from the map where is_gf = false */
export function annotateGfSwaps(ingredients: Ingredient[]): Ingredient[] {
  return ingredients.map(ing => {
    if (ing.is_gf || ing.gf_swap) return ing
    const lower = ing.name.toLowerCase()
    const swap = Object.entries(GF_SWAP_MAP).find(([key]) => lower.includes(key))?.[1] ?? null
    return { ...ing, gf_swap: swap }
  })
}

/** Returns only ingredients where is_gf = false (i.e., need a swap) */
export function getSwappableIngredients(
  ingredients: Ingredient[]
): Array<Ingredient & { gf_swap: string }> {
  return annotateGfSwaps(ingredients).filter(
    (ing): ing is Ingredient & { gf_swap: string } =>
      !ing.is_gf && ing.gf_swap !== null
  )
}
