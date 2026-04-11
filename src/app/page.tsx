import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { HeroImageRotator } from "@/components/home/hero-image-rotator"
import { LocationPromptBanner } from "@/components/home/location-prompt-banner"
import { FeaturedProjectsGrid, type FeaturedProject } from "@/components/home/featured-projects-grid"
import { NgoHomeQuickActions } from "@/components/home/ngo-home-quick-actions"
import { HomeGsap } from "@/components/home/home-gsap"
import { HomeImpactSection, HomeSupportingSections } from "@/components/home/home-extra-sections"
import { JoinMovementSection } from "@/components/home/join-movement-section"
import { HeroThreeBackground } from "@/components/home/hero-three-background"

type HomeSearchParams = { campaignSubmitted?: string | string[] }

function campaignSubmittedFlag(sp: HomeSearchParams): boolean {
  const v = sp.campaignSubmitted
  const s = Array.isArray(v) ? v[0] : v
  return s === "1" || s === "true"
}

export default async function HomePage({ searchParams }: { searchParams: HomeSearchParams }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: me } = user
    ? await supabase.from("users").select("name, email, role").eq("id", user.id).single()
    : { data: null }

  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      location,
      goal_amount,
      funds_raised,
      funding_needed,
      cover_image_url,
      beneficiaries_impacted,
      latitude,
      longitude,
      ngos:ngo_id (
        organization_name,
        verification_status
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6)

  const [
    { count: verifiedNgoPartners },
    { count: volunteerRegistrations },
    { count: activeCampaigns },
    { count: fundedProjects },
    { data: impactRows },
  ] = await Promise.all([
    supabase.from("ngos").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
    supabase.from("volunteers").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "funded"),
    supabase
      .from("projects")
      .select("beneficiaries_impacted")
      .in("status", ["active", "funded", "closed"]),
  ])

  const list: FeaturedProject[] = (projects ?? []).map((p) => {
    const raw = p.ngos as unknown
    const ngo = (Array.isArray(raw) ? raw[0] : raw) as FeaturedProject["ngos"]
    return {
      id: p.id,
      title: p.title,
      location: p.location,
      goal_amount: Number(p.goal_amount),
      funds_raised: Number(p.funds_raised),
      funding_needed: p.funding_needed as boolean | null | undefined,
      cover_image_url: p.cover_image_url,
      beneficiaries_impacted: p.beneficiaries_impacted,
      latitude: p.latitude != null ? Number(p.latitude) : null,
      longitude: p.longitude != null ? Number(p.longitude) : null,
      ngos: ngo,
    }
  })

  const welcomeName =
    me?.name?.trim() ||
    me?.email?.split("@")[0] ||
    user?.email?.split("@")[0] ||
    "there"

  const showCampaignSubmitted = campaignSubmittedFlag(searchParams) && me?.role === "ngo"
  const beneficiariesReached = (impactRows ?? []).reduce((sum, row) => sum + (row.beneficiaries_impacted ?? 0), 0)

  const impactTargets = {
    treesPlanted: Math.round(beneficiariesReached * 0.38 + (verifiedNgoPartners ?? 0) * 20),
    mealsServed: Math.max(0, beneficiariesReached),
    volunteersJoined: volunteerRegistrations ?? 0,
    projectsFunded: fundedProjects ?? 0,
  }

  return (
    <div>
      {showCampaignSubmitted && (
        <div className="relative z-20 border-b border-primary/20 bg-primary/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-foreground">
              Your campaign was submitted for admin review. It will appear on Explore and accept support only after
              approval.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="default">
                <Link href="/dashboard/ngo">NGO dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/">Dismiss</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="relative" data-home-scroll-root>
        <HeroThreeBackground />
        <div className="relative z-10">
          <HomeGsap>
        <section
          id="hero"
          className="relative scroll-mt-24 overflow-hidden border-b bg-gradient-to-b from-accent/35 to-background/90 backdrop-blur-[2px]"
        >
          <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:py-24">
            <div className="flex-1 space-y-6" data-gsap-reveal>
              <Badge variant="secondary" className="w-fit">
                Verified impact marketplace
              </Badge>
              {user ? (
                <>
                  <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Welcome, {welcomeName}</h1>
                  <p className="text-xl font-medium text-muted-foreground">
                    Join verified projects. See transparent impact.
                  </p>
                </>
              ) : (
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                  Join verified projects. See transparent impact.
                </h1>
              )}
              <p className="max-w-xl text-lg text-muted-foreground">
                Soul Space connects NGOs, donors, volunteers, and brands. Every project shows funding progress, field
                media, and verification, so generosity stays transparent.
              </p>
              <div className="space-y-3">
                <LocationPromptBanner variant="default" />
              </div>
              {me?.role === "ngo" && (
                <div className="max-w-xl">
                  <NgoHomeQuickActions />
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/projects">
                    Explore projects <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/feed">Impact feed</Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/volunteer-map">Volunteer near you</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-md flex-1 md:max-w-lg" data-gsap-reveal>
              <HeroImageRotator />
            </div>
          </div>
        </section>

        <HomeImpactSection impactTargets={impactTargets} />

        <section id="projects" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
          <div
            className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between"
            data-gsap-reveal
          >
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Featured projects</h2>
              <p className="text-muted-foreground">
                Live campaigns from partner NGOs, with micro-donations and volunteering where available.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/projects">View all</Link>
            </Button>
          </div>
          <FeaturedProjectsGrid projects={list} />
          {list.length === 0 && (
            <p className="text-center text-muted-foreground">
              No active projects yet. Connect Supabase and run the seed script to see demo data.
            </p>
          )}
        </section>

        <JoinMovementSection />

        <HomeSupportingSections
          stats={{
            verifiedNgoPartners: verifiedNgoPartners ?? 0,
            volunteerRegistrations: volunteerRegistrations ?? 0,
            beneficiariesReached,
            activeCampaigns: activeCampaigns ?? 0,
          }}
        />

        {(me?.role === "ngo" || me?.role === "brand") && (
          <section className="border-t bg-muted/35 py-16 backdrop-blur-xl">
            <div className="mx-auto max-w-6xl px-4 text-center" data-gsap-reveal>
              <h2 className="text-2xl font-bold">For NGOs, brands, and changemakers</h2>
              <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
                NGOs publish verified projects and field updates. Brands co-create CSR campaigns with downloadable impact
                reports. Volunteers discover events on the map.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                {me?.role !== "ngo" && (
                  <Button asChild>
                    <Link href="/register?role=ngo">Register NGO</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/dashboard/ngo">NGO dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/brand">Brand dashboard</Link>
                </Button>
              </div>
            </div>
          </section>
        )}
          </HomeGsap>
        </div>
      </div>
    </div>
  )
}
