import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { projectId?: string; status?: string }
  if (!body.projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 })
  }

  const status = (body.status as "rsvp" | "checked_in" | undefined) ?? "rsvp"

  const { data: existing } = await supabase
    .from("volunteers")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("project_id", body.projectId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("volunteers")
      .update({ status })
      .eq("id", existing.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, id: existing.id, updated: true })
  }

  const { data: project } = await supabase
    .from("projects")
    .select("volunteer_slots, volunteer_count, status")
    .eq("id", body.projectId)
    .single()

  if (!project || project.status !== "active") {
    return NextResponse.json({ error: "Project not open" }, { status: 400 })
  }
  if (project.volunteer_count >= project.volunteer_slots) {
    return NextResponse.json({ error: "Volunteer slots full" }, { status: 400 })
  }

  const { data: row, error } = await supabase
    .from("volunteers")
    .insert({
      user_id: user.id,
      project_id: body.projectId,
      status: "rsvp",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const admin = createAdminClient()
  if (admin) {
    await admin
      .from("projects")
      .update({ volunteer_count: project.volunteer_count + 1 })
      .eq("id", body.projectId)
  }

  return NextResponse.json({ ok: true, id: row?.id })
}
