import { NextRequest, NextResponse } from "next/server"
import { summarizeProjectReport } from "@/lib/groq"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function POST(request: NextRequest) {
  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { report?: string }
  if (!body.report?.trim()) {
    return NextResponse.json({ error: "report required" }, { status: 400 })
  }

  const summary = await summarizeProjectReport(body.report)
  if (!summary) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 })
  }

  return NextResponse.json({ summary })
}
