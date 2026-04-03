import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function GET(request: NextRequest) {
  const supabase = createApiRouteClient(request)

  const { data, error } = await supabase
    .from("impact_updates")
    .select(
      `
      *,
      projects:project_id (
        id,
        title,
        ngos:ngo_id (
          organization_name,
          verification_status
        )
      )
    `
    )
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}
