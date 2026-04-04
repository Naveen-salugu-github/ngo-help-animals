"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateProfileName(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 1 || name.length > 120) {
    return { error: "Name must be 1–120 characters." }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not signed in." }
  }
  const { error } = await supabase.from("users").update({ name }).eq("id", user.id)
  if (error) {
    return { error: error.message }
  }
  revalidatePath("/account")
  revalidatePath("/")
  return { ok: true as const }
}

export async function updateAvatarUrl(url: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Not signed in." }
  }
  if (url !== null && (url.length > 2048 || !url.startsWith("http"))) {
    return { error: "Invalid image URL." }
  }
  const { error } = await supabase.from("users").update({ avatar_url: url }).eq("id", user.id)
  if (error) {
    return { error: error.message }
  }
  revalidatePath("/account")
  revalidatePath("/")
  return { ok: true as const }
}
