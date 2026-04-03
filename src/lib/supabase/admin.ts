import { createClient } from "@supabase/supabase-js"
import { getPublicEnv } from "@/lib/env"

/** Service role client for trusted server operations (payments, counters). */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  const { supabaseUrl } = getPublicEnv()
  return createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
