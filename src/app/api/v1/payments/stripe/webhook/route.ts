import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { completeDonationAndCreditProject } from "@/lib/complete-donation"

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !whSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 503 })
  }

  const rawBody = await request.text()
  const sig = request.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = new Stripe(secret, { typescript: true })
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true })
  }

  const donationId = session.metadata?.donation_id
  if (!donationId) {
    return NextResponse.json({ received: true })
  }

  const admin = createAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "Server error" }, { status: 503 })
  }

  const { data: row } = await admin
    .from("donations")
    .select("stripe_checkout_session_id, payment_provider")
    .eq("id", donationId)
    .single()

  if (!row || row.payment_provider !== "stripe" || row.stripe_checkout_session_id !== session.id) {
    return NextResponse.json({ received: true })
  }

  const pi = session.payment_intent
  const piId = typeof pi === "string" ? pi : pi && typeof pi === "object" && "id" in pi ? String(pi.id) : null

  await completeDonationAndCreditProject(admin, {
    donationId,
    stripePaymentIntentId: piId,
  })

  return NextResponse.json({ received: true })
}
