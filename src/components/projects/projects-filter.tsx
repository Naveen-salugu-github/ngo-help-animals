"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
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
  ngos: {
    organization_name: string
    verification_status: string
  } | null
}

export function ProjectsFilter({ projects }: { projects: ProjectListItem[] }) {
  const [q, setQ] = useState("")
  const [progress, setProgress] = useState<string>("any")

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const hay = `${p.title} ${p.location} ${p.volunteer_category ?? ""}`.toLowerCase()
      if (q && !hay.includes(q.toLowerCase())) return false
      if (progress === "any") return true
      const pct = p.goal_amount > 0 ? p.funds_raised / p.goal_amount : 0
      if (progress === "under25") return pct < 0.25
      if (progress === "25to75") return pct >= 0.25 && pct < 0.75
      if (progress === "over75") return pct >= 0.75
      return true
    })
  }, [projects, q, progress])

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
              <SelectItem value="25to75">25% — 75%</SelectItem>
              <SelectItem value="over75">Over 75%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const ngo = p.ngos
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
                  <Image src={img} alt="" fill className="object-cover" sizes="33vw" />
                </div>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold leading-snug">{p.title}</h2>
                    {ngo?.verification_status === "verified" && (
                      <BadgeCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <p className="text-xs text-muted-foreground">{p.location}</p>
                  <Progress value={pct} className="h-2" />
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>{pct}% funded</span>
                    <span>{p.donor_count} donors</span>
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
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground">No projects match your filters.</p>
      )}
    </div>
  )
}
