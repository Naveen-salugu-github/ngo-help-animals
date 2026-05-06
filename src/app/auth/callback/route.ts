import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler"
import { isEmailOtpType } from "@/lib/supabase/email-otp-types"

/**
 * Completes email confirmation / magic links after Supabase redirects here.
 * Query shapes: PKCE (?code=) or OTP (?token_hash=&type=) depending on project settings.
 *
 * Session cookies are applied to the redirect response so the browser keeps the session.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin
  const nextRaw = url.searchParams.get("next") ?? "/"
  const next = nextRaw.startsWith("/") ? nextRaw : "/"

  const redirectTarget = new URL(next, origin)
  const response = NextResponse.redirect(redirectTarget)
  const supabase = createSupabaseRouteHandlerClient(request, response)

  const code = url.searchParams.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  const token_hash = url.searchParams.get("token_hash")
  const typeParam = url.searchParams.get("type")
  if (token_hash && typeParam && isEmailOtpType(typeParam)) {
    const responseOtp = NextResponse.redirect(redirectTarget)
    const supabaseOtp = createSupabaseRouteHandlerClient(request, responseOtp)
    const { error } = await supabaseOtp.auth.verifyOtp({
      type: typeParam,
      token_hash,
    })
    if (!error) {
      return responseOtp
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", origin))
}
