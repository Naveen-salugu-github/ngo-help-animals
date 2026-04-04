import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

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

  const body = (await request.json()) as { comment?: string; rating?: number }
  const comment = String(body.comment ?? "").trim()
  if (comment.length < 10) {
    return NextResponse.json({ error: "Please write at least a few words" }, { status: 400 })
  }
  if (comment.length > 5000) {
    return NextResponse.json({ error: "Feedback is too long" }, { status: 400 })
  }

  let rating: number | null = null
  if (body.rating != null) {
    const r = Number(body.rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 })
    }
    rating = r
  }

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, event_end_at, status")
    .eq("id", projectId)
    .single()

  if (pErr || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  if (!project.event_end_at) {
    return NextResponse.json(
      { error: "Feedback opens after the campaign lists an event end time and it has passed" },
      { status: 400 }
    )
  }

  if (new Date(project.event_end_at as string) >= new Date()) {
    return NextResponse.json({ error: "Feedback opens after the event end time" }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("project_feedback")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("project_feedback")
      .update({ comment, rating })
      .eq("id", existing.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true, updated: true })
  }

  const { error } = await supabase.from("project_feedback").insert({
    project_id: projectId,
    user_id: user.id,
    comment,
    rating,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
