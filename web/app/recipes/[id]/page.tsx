import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RecipeDetail from '@/components/RecipeDetail'
import type { Recipe } from '@flavor-bomb/shared'

export default async function RecipePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: recipe, error } = await supabase
    .schema('recipes')
    .from('recipes')
    .select('*, ingredients(*)')
    .eq('id', params.id)
    .single()

  if (error || !recipe) notFound()

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', background: 'linear-gradient(135deg, #fdf6ec 0%, #fef9f4 100%)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link href="/recipes" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Recipes</Link>
      </div>
      <RecipeDetail recipe={recipe as Recipe} userId={user.id} />
    </main>
  )
}
