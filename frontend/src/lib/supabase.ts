import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

// Use placeholders when env is missing so the app still renders (auth will fail until .env is set)
const supabaseUrl = url || 'https://placeholder.supabase.co'
const supabaseAnonKey = anonKey || 'placeholder-anon-key'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env in the frontend folder (or project root) and restart the dev server.'
  )
}
