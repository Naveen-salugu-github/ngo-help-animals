export type VolunteerEmailSendResult =
  | { sent: true }
  | { sent: false; reason: "missing_key" | "resend_rejected" }

const DEFAULT_RESEND_FROM = "ImpactBridge <onboarding@resend.dev>"

function resolveResendApiKey(): string | undefined {
  const raw = process.env.RESEND_API_KEY
  if (raw == null || typeof raw !== "string") return undefined
  let t = raw.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim()
  }
  return t || undefined
}

/** Resend requires `email@domain` or `Display Name <email@domain>` (no smart quotes / broken brackets). */
function resolveResendFromEmail(): string {
  const raw = process.env.RESEND_FROM_EMAIL
  if (raw == null || typeof raw !== "string") return DEFAULT_RESEND_FROM
  let t = raw
    .replace(/^\uFEFF/, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim()
  }
  if (!t) return DEFAULT_RESEND_FROM

  const innerEmail = (s: string) => {
    const x = s.trim()
    if (!x || x.includes(" ") || !x.includes("@")) return null
    const [local, ...rest] = x.split("@")
    const domain = rest.join("@")
    if (!local || !domain || !domain.includes(".")) return null
    return x
  }

  if (!t.includes("<")) {
    const email = innerEmail(t)
    if (email) return email
  } else {
    const m = t.match(/^(.+?)<([^>]+)>\s*$/)
    if (m) {
      const name = m[1].trim()
      const email = innerEmail(m[2])
      if (name && email) return `${name} <${email}>`
    }
  }

  console.warn(
    "[email] RESEND_FROM_EMAIL must be a bare address (you@domain.com) or \"Name <you@domain.com>\"; using default sender."
  )
  return DEFAULT_RESEND_FROM
}

type VolunteerConfirmation = {
  to: string
  participantName: string
  eventTitle: string
  eventVenueLine: string
  location: string
  startAt: Date | null
  endAt: Date | null
  projectUrl: string
  whatsappShareUrl: string
}

function formatEventWhen(startAt: Date | null, endAt: Date | null): string {
  if (!startAt) return "Date/time to be announced by the host"
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }
  const start = startAt.toLocaleString("en-IN", opts)
  if (!endAt) return start
  const end = endAt.toLocaleTimeString("en-IN", { timeStyle: "short", timeZone: "Asia/Kolkata" })
  return `${start} – ${end} IST`
}

export async function sendVolunteerRegistrationEmail(
  p: VolunteerConfirmation
): Promise<VolunteerEmailSendResult> {
  const key = resolveResendApiKey()
  const from = resolveResendFromEmail()

  const when = formatEventWhen(p.startAt, p.endAt)
  const place = [p.eventVenueLine, p.location].filter(Boolean).join(" · ") || p.location

  const html = `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; line-height: 1.5;">
    <h1 style="font-size: 20px;">You’re registered</h1>
    <p>Hi ${escapeHtml(p.participantName)},</p>
    <p>You’re signed up for <strong>${escapeHtml(p.eventTitle)}</strong>.</p>
    <table style="margin: 16px 0; border-collapse: collapse;">
      <tr><td style="padding: 4px 12px 4px 0; color:#555;">When</td><td>${escapeHtml(when)}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color:#555;">Where</td><td>${escapeHtml(place)}</td></tr>
    </table>
    <p><a href="${p.projectUrl}">View event details</a></p>
    <p style="margin-top: 24px; font-size: 14px; color: #555;">
      Share with friends on WhatsApp:
      <a href="${p.whatsappShareUrl}">Open WhatsApp with a pre-filled message</a>
    </p>
    <p style="font-size: 12px; color: #888;">ImpactBridge — verified social impact</p>
  </div>`

  if (!key) {
    console.warn("[email] RESEND_API_KEY not set; skipping send to", p.to)
    return { sent: false, reason: "missing_key" }
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [p.to],
      subject: `Registered: ${p.eventTitle}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[email] Resend error:", res.status, err)
    return { sent: false, reason: "resend_rejected" }
  }
  return { sent: true }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function buildWhatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export async function sendOrganizerInquiryEmail(p: {
  to: string
  organizerName: string
  projectTitle: string
  fromEmail: string
  fromName: string
  message: string
  projectUrl: string
}): Promise<boolean> {
  const key = resolveResendApiKey()
  const from = resolveResendFromEmail()

  const html = `
  <div style="font-family: system-ui, sans-serif; max-width: 560px; line-height: 1.5;">
    <h1 style="font-size: 18px;">New message about your campaign</h1>
    <p><strong>${escapeHtml(p.projectTitle)}</strong></p>
    <p style="margin: 16px 0; padding: 12px; background: #f4f4f5; border-radius: 8px;">${escapeHtml(p.message)}</p>
    <p style="font-size: 14px; color: #555;">
      From: ${escapeHtml(p.fromName)} &lt;${escapeHtml(p.fromEmail)}&gt;
    </p>
    <p><a href="${p.projectUrl}">Open campaign</a></p>
    <p style="font-size: 12px; color: #888;">ImpactBridge — reply directly to the sender’s email if needed.</p>
  </div>`

  if (!key) {
    console.warn("[email] RESEND_API_KEY not set; skipping organizer inquiry email")
    return false
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [p.to],
      reply_to: p.fromEmail,
      subject: `Message about: ${p.projectTitle}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[email] Resend organizer inquiry error:", res.status, err)
    return false
  }
  return true
}
