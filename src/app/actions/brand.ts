"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function createBrandProfile(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "brand") return

  const company_name = String(formData.get("company_name") ?? "").trim()
  if (!company_name) return

  const { error } = await supabase.from("brands").insert({
    user_id: user.id,
    company_name,
    logo_url: String(formData.get("logo_url") ?? "") || null,
  })

  if (error) return
  revalidatePath("/dashboard/brand")
}

export async function sponsorProject(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const { data: brand } = await supabase.from("brands").select("id").eq("user_id", user.id).single()
  if (!brand) return

  const project_id = String(formData.get("project_id") ?? "")
  const amount = Number(formData.get("amount"))
  if (!project_id || !amount) return

  const { error } = await supabase.from("sponsorships").insert({
    brand_id: brand.id,
    project_id,
    amount,
    campaign_title: String(formData.get("campaign_title") ?? "") || null,
  })

  if (error) return

  const admin = createAdminClient()
  if (admin) {
    const { data: p } = await admin.from("projects").select("funds_raised").eq("id", project_id).single()
    if (p) {
      await admin
        .from("projects")
        .update({ funds_raised: Number(p.funds_raised) + amount })
        .eq("id", project_id)
    }
  }

  revalidatePath("/dashboard/brand")
  revalidatePath(`/projects/${project_id}`)
}
