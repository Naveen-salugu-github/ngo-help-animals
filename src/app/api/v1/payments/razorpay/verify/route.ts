import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
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
    razorpay_order_id?: string
    razorpay_payment_id?: string
    razorpay_signature?: string
  }

  if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 })
  }

  const hmac = crypto
    .createHmac("sha256", keySecret)
    .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
    .digest("hex")

  if (hmac !== body.razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Service role required to finalize payment" }, { status: 503 })
  }

  const { data: donation } = await admin
    .from("donations")
    .select("id, project_id, amount, user_id")
    .eq("razorpay_order_id", body.razorpay_order_id)
    .eq("user_id", user.id)
    .single()

  if (!donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 })
  }

  await admin
    .from("donations")
    .update({
      payment_status: "completed",
      razorpay_payment_id: body.razorpay_payment_id,
      receipt_url: `/receipts/${donation.id}`,
    })
    .eq("id", donation.id)

  const { data: project } = await admin
    .from("projects")
    .select("funds_raised, donor_count")
    .eq("id", donation.project_id)
    .single()

  if (project) {
    await admin
      .from("projects")
      .update({
        funds_raised: Number(project.funds_raised) + Number(donation.amount),
        donor_count: (project.donor_count ?? 0) + 1,
      })
      .eq("id", donation.project_id)
  }

  return NextResponse.json({
    ok: true,
    donationId: donation.id,
    receiptPath: `/receipts/${donation.id}`,
  })
}
