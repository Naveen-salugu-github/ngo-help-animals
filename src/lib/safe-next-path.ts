/** Allow only same-site relative paths (blocks open redirects). */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (raw == null) return fallback
  const t = String(raw).trim()
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("\0")) return fallback
  return t
}
