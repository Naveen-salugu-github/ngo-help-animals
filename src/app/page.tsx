import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BadgeCheck, ArrowRight } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      location,
      goal_amount,
      funds_raised,
      cover_image_url,
      beneficiaries_impacted,
      ngos:ngo_id (
        organization_name,
        verification_status
      )
    `
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6)

  const list = projects ?? []

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:py-24">
          <div className="flex-1 space-y-6">
            <Badge variant="secondary" className="w-fit">
              Verified impact marketplace
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Fund real projects. See real change.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              ImpactBridge connects NGOs, donors, volunteers, and brands. Every project shows
              funding progress, field media, and verification — so generosity stays transparent.
            </p>
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
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md flex-1 overflow-hidden rounded-2xl border bg-muted shadow-xl md:max-w-lg">
            <Image
              src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=900&q=80"
              alt="Community impact"
              fill
              className="object-cover"
              priority
              sizes="(max-width:768px) 100vw, 480px"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Featured projects</h2>
            <p className="text-muted-foreground">
              Live campaigns from partner NGOs — micro-donations and volunteering supported.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/projects">View all</Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const raw = p.ngos as unknown
            const ngo = (Array.isArray(raw) ? raw[0] : raw) as {
              organization_name: string
              verification_status: string
            } | null
            const pct =
              p.goal_amount > 0
                ? Math.min(100, Math.round((Number(p.funds_raised) / Number(p.goal_amount)) * 100))
                : 0
            const img =
              p.cover_image_url ??
              "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=80"
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                  <div className="relative aspect-[16/10] w-full bg-muted">
                    <Image src={img} alt="" fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-snug">{p.title}</h3>
                      {ngo?.verification_status === "verified" && (
                        <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{p.location}</p>
                    <p className="text-xs text-muted-foreground">{ngo?.organization_name}</p>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{pct}% funded</span>
                      {p.beneficiaries_impacted > 0 && (
                        <span>{p.beneficiaries_impacted} beneficiaries</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
        {list.length === 0 && (
          <p className="text-center text-muted-foreground">
            No active projects yet. Connect Supabase and run the seed script to see demo data.
          </p>
        )}
      </section>

      <section className="border-t bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-2xl font-bold">For NGOs, brands, and changemakers</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            NGOs publish verified projects and field updates. Brands co-create CSR campaigns with
            downloadable impact reports. Volunteers discover events on the map.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="/register">Create account</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/ngo">NGO dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/brand">Brand dashboard</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
