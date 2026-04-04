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

export async function sendVolunteerRegistrationEmail(p: VolunteerConfirmation): Promise<boolean> {
  const key = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? "ImpactBridge <onboarding@resend.dev>"

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
      subject: `Registered: ${p.eventTitle}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("[email] Resend error:", res.status, err)
    return false
  }
  return true
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
