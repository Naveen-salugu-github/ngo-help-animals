"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ProjectStatus } from "@/types/database"

export async function setNgoVerification(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return

  const ngo_id = String(formData.get("ngo_id") ?? "")
  const verification_status = String(formData.get("verification_status") ?? "") as
    | "pending"
    | "verified"
    | "rejected"
  if (!ngo_id || !["pending", "verified", "rejected"].includes(verification_status)) {
    return
  }

  const { error } = await supabase
    .from("ngos")
    .update({ verification_status })
    .eq("id", ngo_id)

  if (error) return
  revalidatePath("/dashboard/admin")
  revalidatePath("/projects")
}

export async function setProjectCampaignStatus(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return

  const project_id = String(formData.get("project_id") ?? "")
  const next = String(formData.get("next_status") ?? "") as "active" | "draft"
  if (!project_id || !["active", "draft"].includes(next)) {
    return
  }

  const { error } = await supabase.from("projects").update({ status: next }).eq("id", project_id)

  if (error) return
  revalidatePath("/dashboard/admin")
  revalidatePath("/projects")
  revalidatePath("/dashboard/ngo")
  revalidatePath("/")
  revalidatePath("/volunteer-map")
  revalidatePath(`/projects/${project_id}`)
}

export type UpdateProjectAsAdminResult = { ok: true } | { ok: false; error: string }

export async function updateProjectAsAdmin(formData: FormData): Promise<UpdateProjectAsAdminResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Sign in required." }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { ok: false, error: "Admin only." }

  const projectId = String(formData.get("project_id") ?? "").trim()
  if (!projectId) return { ok: false, error: "Missing campaign id." }

  const { data: existing, error: fetchErr } = await supabase
    .from("projects")
    .select("id, volunteer_count, funds_raised")
    .eq("id", projectId)
    .single()

  if (fetchErr || !existing) return { ok: false, error: "Campaign not found." }

  const volunteerCount = Number(existing.volunteer_count) || 0

  const isPastCampaign = String(formData.get("is_past_campaign") ?? "") === "true"

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const fundingNeeded = String(formData.get("funding_needed") ?? "true") !== "false"

  let goal_amount = 0
  let micro_donation_units: { amount: number; label: string }[] = []

  if (fundingNeeded) {
    const g = Number(formData.get("goal_amount"))
    if (!title || !description || !location || !g || g < 1) {
      return { ok: false, error: "Fill in title, description, location, and goal amount (INR)." }
    }
    goal_amount = g
    const microRaw = String(formData.get("micro_donation_units") ?? "").trim()
    if (microRaw) {
      try {
        micro_donation_units = JSON.parse(microRaw)
        if (!Array.isArray(micro_donation_units)) throw new Error("invalid")
      } catch {
        return { ok: false, error: "Micro donations must be valid JSON array." }
      }
    } else {
      micro_donation_units = [
        { amount: 50, label: "1 meal" },
        { amount: 200, label: "1 tree" },
        { amount: 1000, label: "1 school kit" },
      ]
    }
  } else {
    if (!title || !description || !location) {
      return { ok: false, error: "Fill in title, description, and location." }
    }
    goal_amount = 0
    micro_donation_units = []
  }

  const lat = formData.get("latitude")
  const lng = formData.get("longitude")

  const campaignDate = String(formData.get("campaign_date") ?? "").trim()
  const startTime = isPastCampaign ? "" : String(formData.get("event_start_time") ?? "").trim()
  const endTime = isPastCampaign ? "" : String(formData.get("event_end_time") ?? "").trim()

  const combineDateTime = (date: string, time: string): string | null => {
    if (!date || !time) return null
    const normalized = time.length === 5 ? `${time}:00` : time
    const d = new Date(`${date}T${normalized}`)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  const event_start_at = isPastCampaign ? null : combineDateTime(campaignDate, startTime)
  const event_end_at = isPastCampaign ? null : combineDateTime(campaignDate, endTime)

  const organizer_contact_phone = String(formData.get("organizer_contact_phone") ?? "").trim()
  const organizer_contact_email = String(formData.get("organizer_contact_email") ?? "").trim()
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizer_contact_email)

  const statusRaw = String(formData.get("status") ?? "active").trim() as ProjectStatus
  const allowed: ProjectStatus[] = ["draft", "pending_review", "active", "funded", "closed"]
  const status: ProjectStatus = allowed.includes(statusRaw) ? statusRaw : "active"

  // Publishing live: require organizer contact (same bar as NGO submission)
  if (status === "active" || status === "pending_review") {
    if (!organizer_contact_phone || organizer_contact_phone.length < 8) {
      return {
        ok: false,
        error: "Add a valid organizer phone (with country code) before setting status to active or pending review.",
      }
    }
    if (!organizer_contact_email || !emailOk) {
      return { ok: false, error: "Add a valid organizer email before publishing or sending for review." }
    }
  }

  let volunteer_slots = Number(formData.get("volunteer_slots") ?? 0) || 0
  let volunteer_category = String(formData.get("volunteer_category") ?? "").trim() || null

  if (isPastCampaign) {
    volunteer_slots = 0
    volunteer_category = null
  } else if (volunteer_slots < volunteerCount) {
    return {
      ok: false,
      error: `Volunteer slots cannot be less than current registrations (${volunteerCount}).`,
    }
  }

  let impact_metrics: Record<string, unknown> = {}
  const impactRaw = String(formData.get("impact_metrics") ?? "").trim()
  if (impactRaw) {
    try {
      const parsed = JSON.parse(impactRaw)
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        impact_metrics = parsed as Record<string, unknown>
      } else {
        return { ok: false, error: "Impact metrics must be a JSON object." }
      }
    } catch {
      return { ok: false, error: "Impact metrics must be valid JSON." }
    }
  }

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      description,
      location,
      funding_needed: fundingNeeded,
      goal_amount,
      micro_donation_units,
      timeline_start: campaignDate || null,
      timeline_end: null,
      status,
      cover_image_url: String(formData.get("cover_image_url") ?? "").trim() || null,
      volunteer_slots,
      volunteer_category,
      latitude: isPastCampaign ? null : lat ? Number(lat) : null,
      longitude: isPastCampaign ? null : lng ? Number(lng) : null,
      impact_metrics,
      beneficiaries_impacted: Number(formData.get("beneficiaries_impacted") ?? 0) || 0,
      event_start_at,
      event_end_at,
      event_venue_detail: isPastCampaign ? null : String(formData.get("event_venue_detail") ?? "").trim() || null,
      organizer_contact_phone: organizer_contact_phone || null,
      organizer_contact_email: organizer_contact_email || null,
      is_past_campaign: isPastCampaign,
    })
    .eq("id", projectId)

  if (error) {
    console.error("updateProjectAsAdmin:", error)
    return { ok: false, error: error.message || "Could not update campaign." }
  }

  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/ngo")
  revalidatePath("/projects")
  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/")
  revalidatePath("/feed")
  revalidatePath("/volunteer-map")
  return { ok: true }
}

export async function deleteProjectAsAdmin(projectId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "Not signed in" }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return { ok: false, error: "Not allowed" }

  const id = projectId.trim()
  if (!id) return { ok: false, error: "Invalid project" }

  const { error } = await supabase.from("projects").delete().eq("id", id)
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard/admin")
  revalidatePath("/projects")
  revalidatePath("/feed")
  revalidatePath("/volunteer-map")
  revalidatePath("/")
  return { ok: true }
}
