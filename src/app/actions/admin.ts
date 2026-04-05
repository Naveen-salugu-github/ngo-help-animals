"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

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

  const { data, error } = await supabase
    .from("projects")
    .update({ status: next })
    .eq("id", project_id)
    .eq("status", "pending_review")
    .select("id")

  if (error) return
  if (!data?.length) return
  revalidatePath("/dashboard/admin")
  revalidatePath("/projects")
  revalidatePath("/dashboard/ngo")
  revalidatePath("/")
  revalidatePath("/volunteer-map")
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
