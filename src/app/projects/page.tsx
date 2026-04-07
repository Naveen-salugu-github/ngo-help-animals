import { createClient } from "@/lib/supabase/server"
import { ProjectsFilter, type ProjectListItem } from "@/components/projects/projects-filter"
import { LocationPromptBanner } from "@/components/home/location-prompt-banner"

export const metadata = {
  title: "Explore projects | Soul Space",
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      description,
      location,
      goal_amount,
      funds_raised,
      cover_image_url,
      donor_count,
      beneficiaries_impacted,
      volunteer_category,
      event_end_at,
      status,
      latitude,
      longitude,
      funding_needed,
      is_past_campaign,
      organizer_contact_phone,
      organizer_contact_email,
      ngos:ngo_id (
        organization_name,
        verification_status
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })

  const list: ProjectListItem[] = (projects ?? []).map((p) => {
    const raw = p.ngos as unknown
    const ngo = (Array.isArray(raw) ? raw[0] : raw) as ProjectListItem["ngos"]
    return {
      ...p,
      ngos: ngo,
      latitude: p.latitude != null ? Number(p.latitude) : null,
      longitude: p.longitude != null ? Number(p.longitude) : null,
    }
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Explore projects</h1>
          <p className="mt-2 text-muted-foreground">
            Filter by cause or location. Every card shows verified NGO badges and live funding.
          </p>
        </div>
      </div>
      <div className="mb-6">
        <LocationPromptBanner variant="compact" />
      </div>
      <ProjectsFilter projects={list} />
    </div>
  )
}
