import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createAdminClient } from "@/lib/supabase/admin"
import { VOLUNTEER_WHATSAPP_CHANNEL_URL } from "@/lib/community-links"
// import { buildWhatsappShareUrl, sendVolunteerRegistrationEmail } from "@/lib/email"
// import { getSiteUrl } from "@/lib/env"

export async function POST(request: NextRequest) {
  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    projectId?: string
    status?: string
    phone?: string
    contactEmail?: string
    participantName?: string
  }

  if (!body.projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 })
  }

  const status = (body.status as "rsvp" | "checked_in" | undefined) ?? "rsvp"
  const phone = String(body.phone ?? "").trim()
  const contactEmail = String(body.contactEmail ?? "").trim()
  const participantName = String(body.participantName ?? "").trim()

  const { data: existing } = await supabase
    .from("volunteers")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("project_id", body.projectId)
    .maybeSingle()

  if (existing) {
    const patch: Record<string, unknown> = { status }
    if (phone) patch.phone = phone
    if (contactEmail) patch.contact_email = contactEmail
    const { error } = await supabase.from("volunteers").update(patch).eq("id", existing.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({
      ok: true,
      id: existing.id,
      updated: true,
      emailSent: false,
      volunteerWhatsappUrl: VOLUNTEER_WHATSAPP_CHANNEL_URL,
    })
  }

  const emailLooksValid = contactEmail.length > 3 && contactEmail.includes("@") && contactEmail.includes(".")
  if (status === "rsvp" && (!participantName || !contactEmail || !emailLooksValid)) {
    return NextResponse.json(
      { error: "Full name and a valid email are required to register for this event" },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json(
      { error: "Server missing SUPABASE_SERVICE_ROLE_KEY; cannot finalize volunteer slots" },
      { status: 503 }
    )
  }

  const { data: project, error: pErr } = await admin
    .from("projects")
    .select(
      "id, title, location, event_venue_detail, event_start_at, event_end_at, volunteer_slots, volunteer_count, status"
    )
    .eq("id", body.projectId)
    .single()

  if (pErr || !project || project.status !== "active") {
    return NextResponse.json({ error: "Project not open" }, { status: 400 })
  }

  if (project.volunteer_slots <= 0) {
    return NextResponse.json({ error: "This project is not accepting volunteers" }, { status: 400 })
  }

  if (project.volunteer_count >= project.volunteer_slots) {
    return NextResponse.json({ error: "Registration is full. No spots left." }, { status: 400 })
  }

  const { data: row, error: insErr } = await supabase
    .from("volunteers")
    .insert({
      user_id: user.id,
      project_id: body.projectId,
      status: "rsvp",
      phone: phone || null,
      contact_email: contactEmail || null,
    })
    .select("id")
    .single()

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 })
  }

  const { data: bumped, error: bumpErr } = await admin
    .from("projects")
    .update({ volunteer_count: project.volunteer_count + 1 })
    .eq("id", body.projectId)
    .eq("volunteer_count", project.volunteer_count)
    .select("volunteer_count")
    .maybeSingle()

  if (bumpErr || !bumped) {
    await admin.from("volunteers").delete().eq("id", row.id)
    return NextResponse.json({ error: "Registration is full. Please try again." }, { status: 409 })
  }

  /*
   * Resend confirmation email disabled for now; clients show WhatsApp channel link instead.
   *
   * const { data: profile } = await admin.from("users").select("name, email").eq("id", user.id).single()
   * const nameForEmail = participantName || profile?.name || profile?.email || "Participant"
   * const emailForSend = contactEmail || profile?.email || ""
   * const site = getSiteUrl()
   * const projectUrl = `${site}/projects/${body.projectId}`
   * const venueLine = (project.event_venue_detail as string | null) ?? ""
   * const loc = project.location as string
   * const title = project.title as string
   * const startAt = project.event_start_at ? new Date(project.event_start_at as string) : null
   * const endAt = project.event_end_at ? new Date(project.event_end_at as string) : null
   * const shareText = `Join me at "${title}" on ImpactBridge: ${projectUrl}`
   * const whatsappShareUrl = buildWhatsappShareUrl(shareText)
   * if (emailForSend) {
   *   const r = await sendVolunteerRegistrationEmail({ to: emailForSend, participantName: nameForEmail, ... })
   * }
   */

  return NextResponse.json({
    ok: true,
    id: row?.id,
    volunteerCount: bumped.volunteer_count,
    emailSent: false,
    volunteerWhatsappUrl: VOLUNTEER_WHATSAPP_CHANNEL_URL,
  })
}
