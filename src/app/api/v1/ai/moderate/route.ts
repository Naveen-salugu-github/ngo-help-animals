import { NextRequest, NextResponse } from "next/server"
import { moderateText } from "@/lib/groq"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function POST(request: NextRequest) {
  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { text?: string }
  if (!body.text?.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 })
  }

  const result = await moderateText(body.text)
  if (!result) {
    return NextResponse.json({ allowed: true, fallback: true })
  }

  return NextResponse.json(result)
}
