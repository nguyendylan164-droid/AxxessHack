import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export type Role = 'client' | 'clinician'

export interface UserProfile {
  id: string
  name: string
  dateOfBirth: string | null
  role: Role
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (
    email: string,
    password: string,
    name: string,
    role: Role
  ) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, date_of_birth, role')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return {
    id: data.id,
    name: data.name ?? '',
    dateOfBirth: data.date_of_birth ?? null,
    role: (data.role === 'clinician' ? 'clinician' : 'client') as Role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const p = await fetchProfile(userId)
    setProfile(p)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user?.id) loadProfile(s.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user?.id) loadProfile(s.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: Error | null }> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ? new Error(error.message) : null }
    },
    []
  )

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      role: Role
    ): Promise<{ error: Error | null }> => {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: (name.trim() || email), role } },
      })

      if (authError) return { error: new Error(authError.message) }
      if (!data.user) return { error: new Error('Sign up failed') }

      // Create profile in public.users (works when email confirmation is off and we have a session).
      // If you add the trigger (003), the trigger also creates the row; this is a fallback.
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        name: (name.trim() || data.user.email) || 'User',
        role,
      })

      if (profileError) {
        // Profile might already exist from trigger, or RLS blocked (e.g. email confirm on, no session)
        if (profileError.code !== '23505') {
          return { error: new Error(profileError.message) }
        }
      }
      return { error: null }
    },
    []
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: (session?.user) ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [session, profile, loading, signIn, signUp, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
