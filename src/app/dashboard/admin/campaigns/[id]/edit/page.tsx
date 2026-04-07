import { redirect, notFound } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AdminEditCampaignForm, type AdminEditCampaignInitial } from "@/components/dashboard/admin-edit-campaign-form"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Edit campaign | Admin | Soul Space" }

type Params = { params: Promise<{ id: string }> }

function isoToDate(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return format(d, "yyyy-MM-dd")
}

function isoToTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return format(d, "HH:mm")
}

export default async function AdminEditCampaignPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/dashboard/admin/campaigns/${id}/edit`)}`)

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Admin only.</p>
      </div>
    )
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("*, ngos:ngo_id ( organization_name )")
    .eq("id", id)
    .single()

  if (error || !project) notFound()

  const fundingNeeded = (project as { funding_needed?: boolean }).funding_needed !== false

  const campaignDate =
    project.event_start_at != null
      ? isoToDate(project.event_start_at as string)
      : project.timeline_start
        ? String(project.timeline_start).slice(0, 10)
        : ""

  const eventStart = project.event_start_at ? isoToTime(project.event_start_at as string) : ""
  const eventEnd = project.event_end_at ? isoToTime(project.event_end_at as string) : ""

  const initial: AdminEditCampaignInitial = {
    id: project.id,
    title: project.title as string,
    description: project.description as string,
    location: project.location as string,
    funding_needed: fundingNeeded,
    goal_amount: Number(project.goal_amount) || 0,
    micro_donation_units: JSON.stringify(project.micro_donation_units ?? [], null, 2),
    cover_image_url: (project.cover_image_url as string | null) ?? null,
    volunteer_slots: Number(project.volunteer_slots) || 0,
    volunteer_category: (project.volunteer_category as string | null) ?? null,
    latitude: project.latitude as number | null,
    longitude: project.longitude as number | null,
    beneficiaries_impacted: Number(project.beneficiaries_impacted) || 0,
    campaign_date: campaignDate,
    event_start_time: eventStart,
    event_end_time: eventEnd,
    event_venue_detail: (project.event_venue_detail as string | null) ?? null,
    organizer_contact_phone: (project as { organizer_contact_phone?: string | null }).organizer_contact_phone ?? null,
    organizer_contact_email: (project as { organizer_contact_email?: string | null }).organizer_contact_email ?? null,
    status: project.status as AdminEditCampaignInitial["status"],
    impact_metrics: JSON.stringify(project.impact_metrics ?? {}, null, 2),
  }

  const raw = project.ngos as unknown
  const ngo = (Array.isArray(raw) ? raw[0] : raw) as { organization_name: string } | null

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 h-8 px-2" asChild>
            <Link href="/dashboard/admin">← Admin</Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit campaign</h1>
          <p className="text-sm text-muted-foreground">
            {ngo?.organization_name ?? "NGO"} · {initial.status}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${id}`} target="_blank" rel="noreferrer">
            View public page
          </Link>
        </Button>
      </div>

      <AdminEditCampaignForm initial={initial} userId={user.id} />
    </div>
  )
}
