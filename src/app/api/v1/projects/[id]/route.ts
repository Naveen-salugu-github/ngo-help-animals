import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = createApiRouteClient(request)

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      ngos:ngo_id (
        id,
        organization_name,
        verification_status,
        description
      )
    `
    )
    .eq("id", id)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  const { data: sponsors } = await supabase
    .from("sponsorships")
    .select(
      `
      amount,
      campaign_title,
      brands:brand_id (
        company_name,
        logo_url
      )
    `
    )
    .eq("project_id", id)

  return NextResponse.json({ data: { ...project, sponsors: sponsors ?? [] } })
}
