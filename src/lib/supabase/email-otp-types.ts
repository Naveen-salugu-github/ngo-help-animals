import type { EmailOtpType } from "@supabase/supabase-js"

export const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "email",
  "recovery",
  "invite",
  "email_change",
  "magiclink",
])

export function isEmailOtpType(type: string): type is EmailOtpType {
  return EMAIL_OTP_TYPES.has(type as EmailOtpType)
}
