"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

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

export async function createProject(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: ngo } = await supabase.from("ngos").select("id").eq("user_id", user.id).single()
  if (!ngo) return

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const goal_amount = Number(formData.get("goal_amount"))
  if (!title || !description || !location || !goal_amount) {
    return
  }

  const microRaw = String(formData.get("micro_donation_units") ?? "").trim()
  let micro_donation_units: { amount: number; label: string }[] = []
  if (microRaw) {
    try {
      micro_donation_units = JSON.parse(microRaw)
      if (!Array.isArray(micro_donation_units)) throw new Error("invalid")
    } catch {
      return
    }
  } else {
    micro_donation_units = [
      { amount: 50, label: "1 meal" },
      { amount: 200, label: "1 tree" },
      { amount: 1000, label: "1 school kit" },
    ]
  }

  const lat = formData.get("latitude")
  const lng = formData.get("longitude")
  const eventStart = String(formData.get("event_start_at") ?? "").trim()
  const eventEnd = String(formData.get("event_end_at") ?? "").trim()
  const parseLocal = (s: string) => {
    if (!s) return null
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  const { error } = await supabase.from("projects").insert({
    ngo_id: ngo.id,
    title,
    description,
    location,
    goal_amount,
    micro_donation_units,
    timeline_start: String(formData.get("timeline_start") ?? "") || null,
    timeline_end: String(formData.get("timeline_end") ?? "") || null,
    status: (formData.get("status") as string) === "draft" ? "draft" : "active",
    cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
    volunteer_slots: Number(formData.get("volunteer_slots") ?? 0) || 0,
    volunteer_category: String(formData.get("volunteer_category") ?? "") || null,
    latitude: lat ? Number(lat) : null,
    longitude: lng ? Number(lng) : null,
    impact_metrics: {},
    beneficiaries_impacted: Number(formData.get("beneficiaries_impacted") ?? 0) || 0,
    event_start_at: parseLocal(eventStart),
    event_end_at: parseLocal(eventEnd),
    event_venue_detail: String(formData.get("event_venue_detail") ?? "").trim() || null,
  })

  if (error) return
  revalidatePath("/dashboard/ngo")
  revalidatePath("/projects")
}

export async function createImpactUpdate(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const project_id = String(formData.get("project_id") ?? "")
  const media_url = String(formData.get("media_url") ?? "").trim()
  const caption = String(formData.get("caption") ?? "").trim()
  if (!project_id || !media_url) return

  const { data: project } = await supabase.from("projects").select("ngo_id").eq("id", project_id).single()
  if (!project) return
  const { data: ngo } = await supabase.from("ngos").select("user_id").eq("id", project.ngo_id).single()
  if (!ngo || ngo.user_id !== user.id) return

  const { error } = await supabase.from("impact_updates").insert({
    project_id,
    media_url,
    media_type: (formData.get("media_type") as string) === "video" ? "video" : "image",
    caption,
    moderation_status: "pending",
  })

  if (error) return
  revalidatePath("/dashboard/ngo")
  revalidatePath("/feed")
}
