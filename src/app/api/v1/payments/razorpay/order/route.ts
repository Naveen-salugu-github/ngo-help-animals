import { NextRequest, NextResponse } from "next/server"
import Razorpay from "razorpay"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createAdminClient } from "@/lib/supabase/admin"
import { DONATIONS_ENABLED } from "@/lib/feature-flags"

export async function POST(request: NextRequest) {
  if (!DONATIONS_ENABLED) {
    return NextResponse.json({ error: "Donations are temporarily unavailable" }, { status: 503 })
  }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Razorpay not configured" }, { status: 503 })
  }

  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    projectId?: string
    amount?: number
    microUnitLabel?: string
  }
  if (!body.projectId || !body.amount || body.amount < 1) {
    return NextResponse.json({ error: "Invalid project or amount" }, { status: 400 })
  }

  const admin = createAdminClient()
  const db = admin ?? supabase

  const { data: project, error: pErr } = await db
    .from("projects")
    .select("id, status, funding_needed")
    .eq("id", body.projectId)
    .single()

  if (pErr || !project || project.status !== "active") {
    return NextResponse.json({ error: "Project not available" }, { status: 400 })
  }
  if (project.funding_needed === false) {
    return NextResponse.json({ error: "This campaign is not accepting donations" }, { status: 400 })
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
  const amountPaise = Math.round(body.amount * 100)

  let order: { id: string }
  try {
    order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `ib_${body.projectId.slice(0, 8)}_${Date.now()}`,
      notes: {
        project_id: body.projectId,
        user_id: user.id,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Order failed"
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const { error: dErr } = await supabase.from("donations").insert({
    user_id: user.id,
    project_id: body.projectId,
    amount: body.amount,
    payment_status: "pending",
    payment_provider: "razorpay",
    razorpay_order_id: order.id,
    micro_unit_label: body.microUnitLabel ?? null,
  })

  if (dErr) {
    return NextResponse.json({ error: dErr.message }, { status: 500 })
  }

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId,
  })
}
