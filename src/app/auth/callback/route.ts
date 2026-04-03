import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "email",
  "recovery",
  "invite",
  "email_change",
  "magiclink",
])

/**
 * Completes email confirmation / magic links after Supabase redirects here.
 * Query shapes: PKCE (?code=) or OTP (?token_hash=&type=) depending on project settings.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  const nextRaw = url.searchParams.get("next") ?? "/"
  const next = nextRaw.startsWith("/") ? nextRaw : "/"

  const supabase = await createClient()

  const code = url.searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  const token_hash = url.searchParams.get("token_hash")
  const typeParam = url.searchParams.get("type")
  if (token_hash && typeParam && OTP_TYPES.has(typeParam as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: typeParam as EmailOtpType,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", origin))
}
