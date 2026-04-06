import { createClient } from "@supabase/supabase-js"
import { type NextRequest } from "next/server"
import { getPublicEnv } from "@/lib/env"

/** Supabase client for Route Handlers; supports `Authorization: Bearer <access_token>` for mobile / API clients. */
export function createApiRouteClient(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv()
  const auth = request.headers.get("authorization")
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: auth ? { Authorization: auth } : {},
    },
  })
}
