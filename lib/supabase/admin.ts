import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Cliente com service role key — ignora RLS.
// NUNCA exponha no client-side. Usar apenas em Server Actions e Route Handlers.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
