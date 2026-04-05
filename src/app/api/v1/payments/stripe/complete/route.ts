import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createAdminClient } from "@/lib/supabase/admin"
import { completeDonationAndCreditProject } from "@/lib/complete-donation"

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 })
  }

  const supabase = createApiRouteClient(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as { sessionId?: string }
  const sessionId = String(body.sessionId ?? "").trim()
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Service configuration error" }, { status: 503 })
  }

  const stripe = new Stripe(secret, { typescript: true })
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    })
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 })
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 400 })
  }

  const donationId = session.metadata?.donation_id
  if (!donationId) {
    return NextResponse.json({ error: "Missing donation reference" }, { status: 400 })
  }

  const { data: donation, error: dErr } = await admin
    .from("donations")
    .select("id, user_id, amount, payment_provider, stripe_checkout_session_id, payment_status")
    .eq("id", donationId)
    .single()

  if (dErr || !donation) {
    return NextResponse.json({ error: "Donation not found" }, { status: 404 })
  }
  if (donation.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (donation.payment_provider !== "stripe") {
    return NextResponse.json({ error: "Invalid donation type" }, { status: 400 })
  }
  if (donation.stripe_checkout_session_id !== session.id) {
    return NextResponse.json({ error: "Session mismatch" }, { status: 400 })
  }

  const expectedMinor = Math.round(Number(donation.amount) * 100)
  if (session.amount_total != null && session.amount_total !== expectedMinor) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
  }

  const pi = session.payment_intent
  const piId = typeof pi === "string" ? pi : pi && typeof pi === "object" && "id" in pi ? String(pi.id) : null

  const done = await completeDonationAndCreditProject(admin, {
    donationId: donation.id,
    stripePaymentIntentId: piId,
  })

  if (!done.ok) {
    return NextResponse.json({ error: done.error }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    donationId: done.donationId,
    receiptPath: `/receipts/${done.donationId}`,
  })
}
