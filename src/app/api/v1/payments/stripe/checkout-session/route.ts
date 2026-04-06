import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createAdminClient } from "@/lib/supabase/admin"
import { DONATIONS_ENABLED } from "@/lib/feature-flags"
import { getSiteUrl } from "@/lib/env"

export async function POST(request: NextRequest) {
  if (!DONATIONS_ENABLED) {
    return NextResponse.json({ error: "Donations are temporarily unavailable" }, { status: 503 })
  }

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

  const body = (await request.json()) as {
    projectId?: string
    amount?: number
    microUnitLabel?: string | null
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

  const { data: donation, error: insErr } = await supabase
    .from("donations")
    .insert({
      user_id: user.id,
      project_id: body.projectId,
      amount: body.amount,
      currency: "INR",
      payment_status: "pending",
      payment_provider: "stripe",
      micro_unit_label: body.microUnitLabel ?? null,
    })
    .select("id")
    .single()

  if (insErr || !donation) {
    return NextResponse.json({ error: insErr?.message ?? "Could not create donation" }, { status: 500 })
  }

  if (!admin) {
    return NextResponse.json({ error: "Service role required to start Stripe checkout" }, { status: 503 })
  }

  const stripe = new Stripe(secret, { typescript: true })
  const site = getSiteUrl()
  const label = body.microUnitLabel ?? "Donation"

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "inr",
            unit_amount: Math.round(body.amount * 100),
            product_data: {
              name: `ImpactBridge: ${label}`,
              description: "Verified social impact contribution",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${site}/donate/success?session_id={CHECKOUT_SESSION_ID}&project_id=${encodeURIComponent(body.projectId)}`,
      cancel_url: `${site}/projects/${body.projectId}`,
      metadata: {
        donation_id: donation.id,
        project_id: body.projectId,
        user_id: user.id,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Stripe session failed"
    await admin.from("donations").delete().eq("id", donation.id)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const { error: upErr } = await admin
    .from("donations")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", donation.id)

  if (upErr || !session.url) {
    return NextResponse.json({ error: upErr?.message ?? "Missing checkout URL" }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
