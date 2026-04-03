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

export async function setImpactModeration(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") return

  const id = String(formData.get("impact_id") ?? "")
  const moderation_status = String(formData.get("moderation_status") ?? "") as
    | "pending"
    | "approved"
    | "rejected"
  if (!id || !["pending", "approved", "rejected"].includes(moderation_status)) {
    return
  }

  const { error } = await supabase.from("impact_updates").update({ moderation_status }).eq("id", id)

  if (error) return
  revalidatePath("/dashboard/admin")
  revalidatePath("/feed")
}
