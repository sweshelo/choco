import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/schema'
import dotenv from 'dotenv'

dotenv.config();

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!
)
