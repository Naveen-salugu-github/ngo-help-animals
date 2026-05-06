"use client"

import { Suspense } from "react"
import { CompleteEmailSession } from "@/components/auth/complete-email-session"

/**
 * Password recovery return URL. Supabase often redirects with only ?code=… and drops
 * other query params, so we cannot rely on ?next=/reset-password on /auth/confirm.
 */
export default function AuthRecoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <CompleteEmailSession redirectAfter="/reset-password" />
    </Suspense>
  )
}
