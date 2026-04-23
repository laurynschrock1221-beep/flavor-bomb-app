import { createClient }  from '@/lib/supabase/server'
import { redirect }      from 'next/navigation'
import PlannerGrid       from '@/components/MealPlanner/PlannerGrid'
import type { Recipe, UserSettings } from '@flavor-bomb/shared'
import { USER_SETTINGS_COLUMNS } from '@flavor-bomb/shared'

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [recipesRes, settingsRes] = await Promise.all([
    supabase.schema('recipes').from('recipes').select('*, ingredients(*)').order('name'),
    supabase.from('user_settings').select(USER_SETTINGS_COLUMNS).eq('user_id', user.id).single(),
  ])

  return (
    <main style={{
      maxWidth: 1200, margin: '0 auto', padding: '24px 16px',
      background: 'linear-gradient(135deg, #fdf6ec 0%, #fef9f4 100%)',
      minHeight: '100vh',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <a href="/recipes" style={{ fontSize: 13, color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Recipes
        </a>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: 0, color: '#1a1a1a' }}>
          Weekly Planner
        </h1>
      </div>
      <PlannerGrid
        recipes={(recipesRes.data as Recipe[]) || []}
        userSettings={settingsRes.data as UserSettings | null}
      />
    </main>
  )
}
