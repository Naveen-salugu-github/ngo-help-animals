import { NextRequest, NextResponse } from "next/server"
import { generateImpactCaption } from "@/lib/groq"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function POST(request: NextRequest) {
  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { context?: string }
  if (!body.context?.trim()) {
    return NextResponse.json({ error: "context required" }, { status: 400 })
  }

  const caption = await generateImpactCaption(body.context)
  if (!caption) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 })
  }

  return NextResponse.json({ caption })
}
