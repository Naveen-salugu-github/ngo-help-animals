import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 })
  }

  const { data: row } = await admin.from("impact_updates").select("share_count").eq("id", id).single()
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await admin
    .from("impact_updates")
    .update({ share_count: (row.share_count ?? 0) + 1 })
    .eq("id", id)

  return NextResponse.json({ ok: true })
}
