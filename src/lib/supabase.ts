import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './env'

function createSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
}

export const supabase: SupabaseClient<Database> = isSupabaseConfigured()
  ? createSupabaseClient()
  : (null as unknown as SupabaseClient<Database>)
