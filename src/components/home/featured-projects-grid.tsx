"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BadgeCheck } from "lucide-react"
import { ProjectCoverImage } from "@/components/projects/project-cover-image"
import { readStoredUserCoords, type StoredUserCoords } from "@/lib/geolocation-storage"
import { sortProjectsByDistance } from "@/lib/sort-projects-by-distance"

export type FeaturedProject = {
  id: string
  title: string
  location: string
  goal_amount: number
  funds_raised: number
  funding_needed?: boolean | null
  cover_image_url: string | null
  beneficiaries_impacted: number
  latitude: number | null
  longitude: number | null
  ngos: { organization_name: string; verification_status: string } | null
}

export function FeaturedProjectsGrid({ projects }: { projects: FeaturedProject[] }) {
  const [coords, setCoords] = useState<StoredUserCoords | null>(null)

  useEffect(() => {
    setCoords(readStoredUserCoords())
    const fn = () => setCoords(readStoredUserCoords())
    window.addEventListener("impactbridge:coords-updated", fn)
    return () => window.removeEventListener("impactbridge:coords-updated", fn)
  }, [])

  const ordered = useMemo(() => {
    if (!coords) return projects
    return sortProjectsByDistance(projects, coords.lat, coords.lng)
  }, [projects, coords])

  return (
    <>
      {coords && (
        <p className="mb-4 text-sm text-muted-foreground">
          Order updates by approximate distance when projects include coordinates.
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((p) => {
          const ngo = p.ngos
          const fundingNeeded = p.funding_needed !== false
          const pct =
            fundingNeeded && p.goal_amount > 0
              ? Math.min(100, Math.round((Number(p.funds_raised) / Number(p.goal_amount)) * 100))
              : 0
          return (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="h-full overflow-hidden transition-shadow hover:shadow-lg">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <ProjectCoverImage
                    src={p.cover_image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
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
                  {fundingNeeded ? (
                    <>
                      <Progress value={pct} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{pct}% funded</span>
                        {p.beneficiaries_impacted > 0 && (
                          <span>{p.beneficiaries_impacted} beneficiaries</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Volunteers &amp; awareness — no public funding goal</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </>
  )
}
