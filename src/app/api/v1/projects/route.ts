import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function GET(request: NextRequest) {
  const supabase = createApiRouteClient(request)
  const { searchParams } = new URL(request.url)
  const cause = searchParams.get("cause")
  const location = searchParams.get("location")
  const minProgress = searchParams.get("minProgress")

  let q = supabase
    .from("projects")
    .select(
      `
      *,
      ngos:ngo_id (
        id,
        organization_name,
        verification_status
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (location) {
    q = q.ilike("location", `%${location}%`)
  }
  if (cause) {
    q = q.ilike("volunteer_category", `%${cause}%`)
  }

  const { data, error } = await q

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let list = data ?? []
  if (minProgress) {
    const min = Number(minProgress) / 100
    list = list.filter((p) => p.goal_amount > 0 && p.funds_raised / p.goal_amount >= min)
  }

  return NextResponse.json({ data: list })
}
