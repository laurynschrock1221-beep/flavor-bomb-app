import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import Link              from 'next/link'
import RecipeList        from '@/components/RecipeList'
import { Suspense }      from 'react'
import type { Recipe, UserSettings } from '@flavor-bomb/shared'
import { USER_SETTINGS_COLUMNS } from '@flavor-bomb/shared'

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: { meal?: string; cuisine?: string; gf?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let q = supabase
    .schema('recipes')
    .from('recipes')
    .select('*, ingredients(*)')
    .order('created_at', { ascending: false })

  if (searchParams.meal)    q = q.contains('meal_type', [searchParams.meal])
  if (searchParams.cuisine) q = q.eq('cuisine',   searchParams.cuisine)
  if (searchParams.gf === 'true') q = q.eq('is_gf', true)

  const [recipesRes, settingsRes] = await Promise.all([
    q,
    supabase.from('user_settings').select(USER_SETTINGS_COLUMNS).eq('user_id', user.id).maybeSingle(),
  ])

  return (
    <main style={{
      maxWidth: 1100, margin: '0 auto', padding: '24px 16px',
      background: 'linear-gradient(135deg, #fdf6ec 0%, #fef9f4 100%)',
      minHeight: '100vh',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: 0, color: '#1a1a1a' }}>
          Recipes
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/settings" style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #ede8e0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#666', textDecoration: 'none' }}>
            ⚙️ Settings
          </Link>
          <Link href="/planner" style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #ede8e0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#666', textDecoration: 'none' }}>
            Planner
          </Link>
          <Link href="/recipes/import" style={{ padding: '8px 16px', borderRadius: 10, background: '#C1440E', fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
            📸 Import
          </Link>
          <Link href="/recipes/create" style={{ padding: '8px 16px', borderRadius: 10, background: '#1a1a1a', fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>
            ✨ Create
          </Link>
        </div>
      </div>

      <Suspense>
        <RecipeList
          initialRecipes={(recipesRes.data as Recipe[]) || []}
          userSettings={settingsRes.data as UserSettings | null}
        />
      </Suspense>
    </main>
  )
}
