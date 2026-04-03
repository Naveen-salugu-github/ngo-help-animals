export function getPublicEnv() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  }
}

/**
 * Use in Client Components for absolute URLs (e.g. Supabase emailRedirectTo).
 * Prefers NEXT_PUBLIC_APP_URL; otherwise uses the current browser origin so production
 * (e.g. Vercel) works even if the env var was not set.
 */
export function getBrowserAppUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (env) return env.replace(/\/$/, "")
  if (typeof window !== "undefined") return window.location.origin
  return "http://localhost:3000"
}

/** Server / edge: site URL for redirects (Vercel provides VERCEL_URL). */
export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (env) return env.replace(/\/$/, "")
  const vercel = process.env.VERCEL_URL?.trim()
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`
  return "http://localhost:3000"
}

export function requireServerEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env: ${name}`)
  return v
}
