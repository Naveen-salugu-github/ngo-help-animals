"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { isEmailOtpType } from "@/lib/supabase/email-otp-types"
import { safeNextPath } from "@/lib/safe-next-path"
import { toast } from "sonner"

/**
 * Client-side auth return URL for email links that put tokens in the URL hash
 * (fragments are never sent to the server, so /auth/callback cannot see them).
 * Also retries PKCE code exchange in the browser where the verifier cookie exists.
 */
export default function AuthConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Completing sign-in…")

  useEffect(() => {
    let cancelled = false

    const fail = (message: string) => {
      toast.error(message)
      router.replace("/login?error=auth_confirm")
    }

    const succeed = (next: string) => {
      if (cancelled) return
      router.replace(next)
      router.refresh()
    }

    const run = async () => {
      const next = safeNextPath(searchParams.get("next"))
      const supabase = createClient()

      const hash = typeof window !== "undefined" ? window.location.hash : ""
      if (hash.startsWith("#")) {
        const params = new URLSearchParams(hash.slice(1))
        const access_token = params.get("access_token")
        const refresh_token = params.get("refresh_token")
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          window.history.replaceState(null, "", window.location.pathname + window.location.search)
          if (error) {
            fail(error.message)
            return
          }
          succeed(next)
          return
        }
      }

      const code = searchParams.get("code")
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) {
          fail(
            "This sign-in link could not be completed. Try requesting a new reset email, and open the link in the same browser you used to send it."
          )
          return
        }
        succeed(next)
        return
      }

      const token_hash = searchParams.get("token_hash")
      const typeParam = searchParams.get("type")
      if (token_hash && typeParam && isEmailOtpType(typeParam)) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: typeParam as EmailOtpType,
        })
        if (error) {
          fail(error.message)
          return
        }
        succeed(next)
        return
      }

      setStatus("Invalid or expired link.")
      fail("Invalid or expired sign-in link.")
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center text-sm text-muted-foreground">
      {status}
    </div>
  )
}
