import { NextRequest, NextResponse } from "next/server"
import { fetchImpactFeedRows } from "@/lib/impact-feed-data"
import { createClient } from "@/lib/supabase/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function GET(request: NextRequest) {
  const supabase = request.headers.get("authorization")
    ? createApiRouteClient(request)
    : await createClient()

  const rows = await fetchImpactFeedRows(supabase)
  return NextResponse.json({ data: rows })
}
