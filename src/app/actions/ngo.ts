"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const impactMediaItemSchema = z.object({
  media_url: z.string().min(1),
  media_type: z.enum(["image", "video"]),
})

const impactBatchPayloadSchema = z.array(impactMediaItemSchema).min(1).max(12)

export type CreateProjectResult =
  | { ok: true; submittedForReview: boolean }
  | { ok: false; error: string }

export async function createNgoProfile(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "ngo") return

  const organization_name = String(formData.get("organization_name") ?? "").trim()
  if (!organization_name) return

  const { error } = await supabase.from("ngos").insert({
    user_id: user.id,
    organization_name,
    registration_number: String(formData.get("registration_number") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    pan_number: String(formData.get("pan_number") ?? "") || null,
  })

  if (error) return
  revalidatePath("/dashboard/ngo")
}

export async function createProject(formData: FormData): Promise<CreateProjectResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, error: "Sign in required." }
  }

  const { data: ngo } = await supabase.from("ngos").select("id").eq("user_id", user.id).single()
  if (!ngo) {
    return { ok: false, error: "Save your organization profile first." }
  }

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

  const isPastCampaign = String(formData.get("is_past_campaign") ?? "") === "true"

  const latRaw = formData.get("latitude")
  const lngRaw = formData.get("longitude")

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

  const submittedAsDraft = String(formData.get("status") ?? "") === "draft"
  const nextStatus = submittedAsDraft ? "draft" : "pending_review"

  const organizer_contact_phone = String(formData.get("organizer_contact_phone") ?? "").trim()
  const organizer_contact_email = String(formData.get("organizer_contact_email") ?? "").trim()
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organizer_contact_email)

  if (!submittedAsDraft) {
    if (!organizer_contact_phone || organizer_contact_phone.length < 8) {
      return {
        ok: false,
        error: "Add a valid organizer phone (with country code) before submitting for review.",
      }
    }
    if (!organizer_contact_email || !emailOk) {
      return { ok: false, error: "Add a valid organizer email before submitting for review." }
    }
  }

  const { error } = await supabase.from("projects").insert({
    ngo_id: ngo.id,
    title,
    description,
    location,
    funding_needed: fundingNeeded,
    goal_amount,
    micro_donation_units,
    timeline_start: campaignDate || null,
    timeline_end: null,
    status: nextStatus,
    cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
    volunteer_slots: isPastCampaign ? 0 : Number(formData.get("volunteer_slots") ?? 0) || 0,
    volunteer_category: isPastCampaign ? null : String(formData.get("volunteer_category") ?? "") || null,
    latitude: isPastCampaign ? null : latRaw ? Number(latRaw) : null,
    longitude: isPastCampaign ? null : lngRaw ? Number(lngRaw) : null,
    impact_metrics: {},
    beneficiaries_impacted: Number(formData.get("beneficiaries_impacted") ?? 0) || 0,
    event_start_at,
    event_end_at,
    event_venue_detail: isPastCampaign ? null : String(formData.get("event_venue_detail") ?? "").trim() || null,
    organizer_contact_phone: organizer_contact_phone || null,
    organizer_contact_email: organizer_contact_email || null,
    is_past_campaign: isPastCampaign,
  })

  if (error) {
    let msg = error.message || "Could not create campaign."
    if (/project_status|enum|pending_review|invalid input value for enum/i.test(msg)) {
      msg =
        "Database is missing campaign status “pending_review”. In Supabase → SQL Editor, run: ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'pending_review'; (or apply migration 20260404180000_project_pending_review.sql)"
    }
    console.error("createProject:", error)
    return { ok: false, error: msg }
  }
  revalidatePath("/dashboard/ngo")
  revalidatePath("/projects")
  revalidatePath("/")

  return { ok: true, submittedForReview: !submittedAsDraft }
}

export type CreateImpactUpdateResult =
  | { ok: true }
  | { ok: false; error: string }

export async function createImpactUpdate(formData: FormData): Promise<CreateImpactUpdateResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "You must be signed in." }

  const project_id = String(formData.get("project_id") ?? "").trim()
  const caption = String(formData.get("caption") ?? "").trim()
  if (!project_id) {
    return { ok: false, error: "Choose a project." }
  }

  const { data: project } = await supabase.from("projects").select("ngo_id").eq("id", project_id).single()
  if (!project) return { ok: false, error: "Campaign not found." }
  const { data: ngo } = await supabase.from("ngos").select("user_id").eq("id", project.ngo_id).single()
  if (!ngo || ngo.user_id !== user.id) {
    return { ok: false, error: "You can only post updates for your own campaigns." }
  }

  const batchRaw = formData.get("media_items_json")
  let items: z.infer<typeof impactBatchPayloadSchema>

  if (batchRaw != null && String(batchRaw).trim() !== "") {
    try {
      const parsed = JSON.parse(String(batchRaw))
      items = impactBatchPayloadSchema.parse(parsed)
    } catch {
      return { ok: false, error: "Invalid media list. Use 1–12 images or videos." }
    }
  } else {
    const media_url = String(formData.get("media_url") ?? "").trim()
    if (!media_url) {
      return { ok: false, error: "Add at least one photo or video, or paste a link." }
    }
    const media_type = (formData.get("media_type") as string) === "video" ? "video" : "image"
    items = [{ media_url, media_type }]
  }

  if (items.length > 1 && items.some((i) => i.media_type === "video")) {
    return { ok: false, error: "Carousel posts currently support images only. Upload one video at a time." }
  }

  const mediaUrls = items.map((i) => i.media_url)
  const primary = items[0]

  const { error } = await supabase.from("impact_updates").insert({
    project_id,
    media_url: primary.media_url,
    media_type: primary.media_type,
    media_urls: mediaUrls.length > 1 ? mediaUrls : null,
    caption,
    moderation_status: "approved" as const,
  })

  if (error) {
    console.error("createImpactUpdate:", error)
    return { ok: false, error: error.message || "Could not save your update." }
  }
  revalidatePath("/dashboard/ngo")
  revalidatePath("/feed")
  revalidatePath("/")
  revalidatePath(`/projects/${project_id}`)
  return { ok: true }
}
