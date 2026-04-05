import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Marks a pending donation completed and credits the project once (idempotent if already completed).
 */
export async function completeDonationAndCreditProject(
  admin: SupabaseClient,
  params: {
    donationId: string
    razorpayPaymentId?: string | null
    stripePaymentIntentId?: string | null
  }
): Promise<{ ok: true; donationId: string } | { ok: false; error: string }> {
  const { data: donation, error: dErr } = await admin
    .from("donations")
    .select("id, project_id, amount, payment_status")
    .eq("id", params.donationId)
    .single()

  if (dErr || !donation) {
    return { ok: false, error: "Donation not found" }
  }
  if (donation.payment_status === "completed") {
    return { ok: true, donationId: donation.id }
  }

  const patch: Record<string, unknown> = {
    payment_status: "completed",
    receipt_url: `/receipts/${donation.id}`,
  }
  if (params.razorpayPaymentId) patch.razorpay_payment_id = params.razorpayPaymentId
  if (params.stripePaymentIntentId) patch.stripe_payment_intent_id = params.stripePaymentIntentId

  const { data: updated, error: uErr } = await admin
    .from("donations")
    .update(patch)
    .eq("id", donation.id)
    .eq("payment_status", "pending")
    .select("id")

  if (uErr) {
    return { ok: false, error: uErr.message }
  }
  if (!updated?.length) {
    const { data: again } = await admin
      .from("donations")
      .select("payment_status")
      .eq("id", donation.id)
      .single()
    if (again?.payment_status === "completed") {
      return { ok: true, donationId: donation.id }
    }
    return { ok: false, error: "Could not finalize donation" }
  }

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

  return { ok: true, donationId: donation.id }
}
