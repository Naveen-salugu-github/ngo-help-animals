"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BadgeCheck } from "lucide-react"
import { campaignAcceptsOrganizerContact, eventHasFinished } from "@/lib/campaign-utils"
import { ContactOrganizerDialog } from "@/components/projects/contact-organizer-dialog"
import { PostEventFeedbackDialog } from "@/components/projects/post-event-feedback-dialog"
import { ProjectCoverImage } from "@/components/projects/project-cover-image"
import { readStoredUserCoords, type StoredUserCoords } from "@/lib/geolocation-storage"
import { sortProjectsByDistance } from "@/lib/sort-projects-by-distance"

export type ProjectListItem = {
  id: string
  title: string
  description: string
  location: string
  goal_amount: number
  funds_raised: number
  cover_image_url: string | null
  donor_count: number
  beneficiaries_impacted: number
  volunteer_category: string | null
  event_end_at: string | null
  status: string
  latitude: number | null
  longitude: number | null
  funding_needed: boolean | null
  organizer_contact_phone: string | null
  organizer_contact_email: string | null
  ngos: {
    organization_name: string
    verification_status: string
  } | null
}

export function ProjectsFilter({ projects }: { projects: ProjectListItem[] }) {
  const [q, setQ] = useState("")
  const [progress, setProgress] = useState<string>("any")
  const [coords, setCoords] = useState<StoredUserCoords | null>(null)

  useEffect(() => {
    setCoords(readStoredUserCoords())
    const fn = () => setCoords(readStoredUserCoords())
    window.addEventListener("Soul Space:coords-updated", fn)
    return () => window.removeEventListener("Soul Space:coords-updated", fn)
  }, [])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const hay = `${p.title} ${p.location} ${p.volunteer_category ?? ""}`.toLowerCase()
      if (q && !hay.includes(q.toLowerCase())) return false
      if (progress === "any") return true
      if (p.funding_needed === false) return false
      const pct = p.goal_amount > 0 ? p.funds_raised / p.goal_amount : 0
      if (progress === "under25") return pct < 0.25
      if (progress === "25to75") return pct >= 0.25 && pct < 0.75
      if (progress === "over75") return pct >= 0.75
      return true
    })
  }, [projects, q, progress])

  const displayList = useMemo(() => {
    if (!coords) return filtered
    return sortProjectsByDistance(filtered, coords.lat, coords.lng)
  }, [filtered, coords])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="q">Search location or cause</Label>
          <Input
            id="q"
            placeholder="e.g. Vizag, education, trees…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="w-full space-y-2 sm:w-56">
          <Label>Funding progress</Label>
          <Select value={progress} onValueChange={setProgress}>
            <SelectTrigger>
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="under25">Under 25%</SelectItem>
              <SelectItem value="25to75">25% to 75%</SelectItem>
              <SelectItem value="over75">Over 75%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {displayList.map((p) => {
          const ngo = p.ngos
          const fundingNeeded = p.funding_needed !== false
          const pct =
            fundingNeeded && p.goal_amount > 0
              ? Math.min(100, Math.round((Number(p.funds_raised) / Number(p.goal_amount)) * 100))
              : 0
          const active = p.status === "active"
          const showContact = active && campaignAcceptsOrganizerContact(p.event_end_at)
          const showFeedback = active && eventHasFinished(p.event_end_at)
          const ngoName = ngo?.organization_name ?? "Organizer"
          return (
            <Card key={p.id} className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
              <Link href={`/projects/${p.id}`} className="block shrink-0">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <ProjectCoverImage
                    src={p.cover_image_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              </Link>
              <CardContent className="flex flex-1 flex-col space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/projects/${p.id}`} className="min-w-0 flex-1 hover:underline">
                    <h2 className="font-semibold leading-snug">{p.title}</h2>
                  </Link>
                  {ngo?.verification_status === "verified" && (
                    <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  )}
                </div>
                <Link href={`/projects/${p.id}`} className="block min-h-0 flex-1">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.location}</p>
                </Link>
                {fundingNeeded ? (
                  <>
                    <Progress value={pct} className="h-2" />
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{pct}% funded</span>
                      <span>{p.donor_count} donors</span>
                      {p.beneficiaries_impacted > 0 && (
                        <span>{p.beneficiaries_impacted} beneficiaries</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Volunteers and awareness only: no public funding goal
                  </p>
                )}
                {(showContact || showFeedback) && (
                  <div className="grid gap-2 border-t pt-3">
                    {showContact && (
                      <ContactOrganizerDialog
                        projectId={p.id}
                        projectTitle={p.title}
                        ngoName={ngoName}
                        variant="compact"
                        organizerContactPhone={p.organizer_contact_phone}
                        organizerContactEmail={p.organizer_contact_email}
                      />
                    )}
                    {showFeedback && (
                      <PostEventFeedbackDialog
                        projectId={p.id}
                        projectTitle={p.title}
                        variant="compact"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {displayList.length === 0 && (
        <p className="text-center text-muted-foreground">No projects match your filters.</p>
      )}
    </div>
  )
}
