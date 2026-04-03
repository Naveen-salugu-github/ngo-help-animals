import { NextRequest, NextResponse } from "next/server"
import { generateCsrSummary } from "@/lib/groq"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function POST(request: NextRequest) {
  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "brand" && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = (await request.json()) as { brandName?: string; totals?: string }
  if (!body.brandName || !body.totals) {
    return NextResponse.json({ error: "brandName and totals required" }, { status: 400 })
  }

  const summary = await generateCsrSummary({
    brandName: body.brandName,
    totals: body.totals,
  })
  if (!summary) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 })
  }

  return NextResponse.json({ summary })
}
