import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, company?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('Profil introuvable:', error.message)
    return null
  }

  return data as Profile | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return

    const { data: { session } } = await supabase.auth.getSession()
    let profile: Profile | null = null

    if (session?.user) {
      profile = await fetchProfile(session.user.id)
    }

    set({ session, user: session?.user ?? null, profile, initialized: true })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      let profile: Profile | null = null
      if (session?.user) {
        profile = await fetchProfile(session.user.id)
      }
      set({ session, user: session?.user ?? null, profile })
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    set({ loading: false })

    if (error) {
      return { error: error.message }
    }

    const profile = data.user ? await fetchProfile(data.user.id) : null
    set({
      session: data.session,
      user: data.user,
      profile,
    })

    return { error: null }
  },

  signUp: async (email, password, fullName, company) => {
    set({ loading: true })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company: company ?? 'Mon organisation',
        },
      },
    })
    set({ loading: false })

    if (error) {
      return { error: error.message }
    }

    if (data.session && data.user) {
      const profile = await fetchProfile(data.user.id)
      set({ session: data.session, user: data.user, profile })
    }

    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },
}))
