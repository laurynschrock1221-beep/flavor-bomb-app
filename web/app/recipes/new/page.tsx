export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RecipeFormPage from '@/components/RecipeFormPage'

export default async function NewRecipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', background: 'linear-gradient(135deg, #fdf6ec 0%, #fef9f4 100%)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <Link href="/recipes" style={{ fontSize: 13, color: '#888', textDecoration: 'none' }}>← Recipes</Link>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, margin: 0, color: '#1a1a1a' }}>New Recipe</h1>
      </div>
      <RecipeFormPage />
    </main>
  )
}
