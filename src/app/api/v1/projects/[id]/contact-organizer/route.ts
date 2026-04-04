import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendOrganizerInquiryEmail } from "@/lib/email"
import { getSiteUrl } from "@/lib/env"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id: projectId } = await params
  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { message?: string }
  const message = String(body.message ?? "").trim()
  if (message.length < 5) {
    return NextResponse.json({ error: "Message is too short" }, { status: 400 })
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "Message is too long" }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 503 })
  }

  const { data: project, error: pErr } = await admin
    .from("projects")
    .select("id, title, status, event_end_at, ngo_id")
    .eq("id", projectId)
    .single()

  if (pErr || !project || project.status !== "active") {
    return NextResponse.json({ error: "Campaign not available" }, { status: 404 })
  }

  const endAt = project.event_end_at ? new Date(project.event_end_at as string) : null
  if (endAt && endAt < new Date()) {
    return NextResponse.json({ error: "This campaign has ended — use feedback instead" }, { status: 400 })
  }

  const { data: ngo } = await admin.from("ngos").select("user_id, organization_name").eq("id", project.ngo_id).single()
  if (!ngo) {
    return NextResponse.json({ error: "Organizer not found" }, { status: 404 })
  }

  const { data: organizer } = await admin.from("users").select("email, name").eq("id", ngo.user_id).single()
  if (!organizer?.email) {
    return NextResponse.json({ error: "Organizer email unavailable" }, { status: 503 })
  }

  const { data: sender } = await admin.from("users").select("email, name").eq("id", user.id).single()
  const fromEmail = sender?.email ?? user.email ?? ""
  const fromName = sender?.name || fromEmail || "Supporter"

  const { error: insErr } = await supabase.from("organizer_inquiries").insert({
    project_id: projectId,
    from_user_id: user.id,
    from_email: fromEmail,
    message,
  })

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 })
  }

  const site = getSiteUrl()
  const emailed = await sendOrganizerInquiryEmail({
    to: organizer.email,
    organizerName: ngo.organization_name ?? "Organizer",
    projectTitle: project.title as string,
    fromEmail,
    fromName,
    message,
    projectUrl: `${site}/projects/${projectId}`,
  })

  return NextResponse.json({ ok: true, emailSent: emailed })
}
