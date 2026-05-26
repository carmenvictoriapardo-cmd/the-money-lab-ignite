import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { User as Profile } from '../types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: unknown; error: Error | null }>
  refreshProfile: () => Promise<void>
  markOnboarded: () => Promise<{ data: unknown; error: Error | null }>
  signPacto: (fullName: string) => Promise<{ data: unknown; error: Error | null }>
  getCurrentWeek: () => number
  getCurrentDay: () => number
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(user: User) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(data ?? null)
    setLoading(false)
  }

  async function refreshProfile() {
    if (!session?.user) return
    await fetchProfile(session.user)
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!session?.user) return { data: null, error: new Error('No session') }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single()
    if (!error && data) setProfile(data as Profile)
    return { data, error }
  }

  async function markOnboarded() {
    return updateProfile({ onboarded: true })
  }

  async function signPacto(fullName: string) {
    return updateProfile({
      full_name: fullName,
      el_pacto_signed: true,
      el_pacto_signed_at: new Date().toISOString(),
      program_start_date: new Date().toISOString().split('T')[0],
      onboarded: true,
    })
  }

  async function signInWithMagicLink(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/dashboard' },
    })
    return { error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function getCurrentWeek(): number {
    if (!profile?.program_start_date) return 1
    const start = new Date(profile.program_start_date)
    const today = new Date()
    const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return Math.min(13, Math.max(1, Math.ceil((days + 1) / 7)))
  }

  function getCurrentDay(): number {
    if (!profile?.program_start_date) return 1
    const start = new Date(profile.program_start_date)
    const today = new Date()
    const days = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.min(90, Math.max(1, days))
  }

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      signInWithMagicLink,
      signOut,
      updateProfile,
      refreshProfile,
      markOnboarded,
      signPacto,
      getCurrentWeek,
      getCurrentDay,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
