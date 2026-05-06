import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import { getPublicEnv } from "@/lib/env"

/**
 * Supabase server client for Route Handlers: session cookies must be written
 * onto the same {@link NextResponse} that is returned (especially redirects).
 */
export function createSupabaseRouteHandlerClient(
  request: NextRequest,
  response: NextResponse
) {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[], cacheHeaders) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
        if (cacheHeaders && typeof cacheHeaders === "object") {
          Object.entries(cacheHeaders).forEach(([key, value]) => {
            if (typeof value === "string") response.headers.set(key, value)
          })
        }
      },
    },
  })
}
