import { createBrowserClient } from '@supabase/ssr'

function cleanSupabaseUrl(url: string) {
  // Strip any path suffix (e.g. /rest/v1/, /auth/v1) that gets mistakenly pasted in
  return url.replace(/\/(rest|auth|storage|realtime)(\/.*)?$/, '').replace(/\/$/, '')
}

export function createClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  return createBrowserClient(
    cleanSupabaseUrl(rawUrl),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  )
}
