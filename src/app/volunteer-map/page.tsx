import { createClient } from "@/lib/supabase/server"
import { VolunteerMap } from "@/components/map/volunteer-map"

export const metadata = {
  title: "Volunteer map | ImpactBridge",
}

export default async function VolunteerMapPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("projects")
    .select(
      "id, title, location, latitude, longitude, volunteer_category, volunteer_slots, volunteer_count"
    )
    .eq("status", "active")
    .gt("volunteer_slots", 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Volunteer near you</h1>
        <p className="mt-2 text-muted-foreground">
          Explore map pins for beach cleanups, camps, teaching drives, and more. RSVP from the project page.
        </p>
      </div>
      <VolunteerMap projects={data ?? []} />
    </div>
  )
}
