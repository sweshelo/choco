import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/schema'

export interface Env {
  SUPABASE_URL: string
  SUPABASE_API_KEY: string
  CF_KV?: KVNamespace
}

export const getSupabaseClient = (env: Env): SupabaseClient<Database> => {
  return createClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_API_KEY
  )
}
