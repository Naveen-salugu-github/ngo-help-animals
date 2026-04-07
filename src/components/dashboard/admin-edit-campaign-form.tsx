"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProjectAsAdmin } from "@/app/actions/admin"
import { uploadCampaignCoverImage } from "@/lib/campaign-cover-upload"
import { CampaignCoverImageField } from "@/components/dashboard/campaign-cover-image-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { ProjectStatus } from "@/types/database"

export type AdminEditCampaignInitial = {
  id: string
  title: string
  description: string
  location: string
  funding_needed: boolean
  goal_amount: number
  micro_donation_units: string
  cover_image_url: string | null
  volunteer_slots: number
  volunteer_category: string | null
  latitude: number | null
  longitude: number | null
  beneficiaries_impacted: number
  campaign_date: string
  event_start_time: string
  event_end_time: string
  event_venue_detail: string | null
  organizer_contact_phone: string | null
  organizer_contact_email: string | null
  status: ProjectStatus
  impact_metrics: string
}

type Props = { initial: AdminEditCampaignInitial; userId: string }

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "active", label: "Active (live)" },
  { value: "funded", label: "Funded" },
  { value: "closed", label: "Closed" },
]

export function AdminEditCampaignForm({ initial, userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fundingNeeded, setFundingNeeded] = useState(initial.funding_needed)
  const [status, setStatus] = useState<ProjectStatus>(initial.status)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set("funding_needed", fundingNeeded ? "true" : "false")
    fd.set("status", status)

    if (coverFile) {
      const up = await uploadCampaignCoverImage(userId, coverFile)
      if (!up.ok) {
        toast.error(up.error)
        setLoading(false)
        return
      }
      fd.set("cover_image_url", up.publicUrl)
    }

    try {
      const result = await updateProjectAsAdmin(fd)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Campaign updated.")
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="project_id" value={initial.id} />

      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="admin-campaign-status">Publication status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)} disabled={loading}>
          <SelectTrigger id="admin-campaign-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={status} />
        <p className="text-xs text-muted-foreground">
          Set to <strong>Active</strong> to show the campaign on Explore and the map. Use <strong>Draft</strong> to hide
          it while you edit.
        </p>
      </div>

      <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <Checkbox
          id="admin-funding-needed"
          checked={fundingNeeded}
          onCheckedChange={(v) => setFundingNeeded(v === true)}
          disabled={loading}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="admin-funding-needed" className="cursor-pointer font-medium leading-snug">
            This campaign needs online donations
          </Label>
          <p className="text-xs text-muted-foreground">
            When off, funding goal and micro-donations are cleared in the database for this save (goal 0, empty units).
          </p>
        </div>
      </div>

      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={initial.title} disabled={loading} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} required defaultValue={initial.description} disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" required defaultValue={initial.location} disabled={loading} />
      </div>
      {fundingNeeded && (
        <div className="space-y-2">
          <Label htmlFor="goal_amount">Goal amount (INR)</Label>
          <Input
            id="goal_amount"
            name="goal_amount"
            type="number"
            min={1}
            required={fundingNeeded}
            defaultValue={initial.goal_amount || 1}
            disabled={loading}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="volunteer_slots">Volunteer slots</Label>
        <Input
          id="volunteer_slots"
          name="volunteer_slots"
          type="number"
          min={0}
          defaultValue={initial.volunteer_slots}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="volunteer_category">Volunteer category</Label>
        <Input
          id="volunteer_category"
          name="volunteer_category"
          defaultValue={initial.volunteer_category ?? ""}
          placeholder="e.g. Environment"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="latitude">Latitude</Label>
        <Input
          id="latitude"
          name="latitude"
          type="number"
          step="any"
          defaultValue={initial.latitude ?? ""}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="longitude">Longitude</Label>
        <Input
          id="longitude"
          name="longitude"
          type="number"
          step="any"
          defaultValue={initial.longitude ?? ""}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign_date">Campaign / event date</Label>
        <Input id="campaign_date" name="campaign_date" type="date" defaultValue={initial.campaign_date} disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event_start_time">Start time</Label>
        <Input id="event_start_time" name="event_start_time" type="time" defaultValue={initial.event_start_time} disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event_end_time">End time</Label>
        <Input id="event_end_time" name="event_end_time" type="time" defaultValue={initial.event_end_time} disabled={loading} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="event_venue_detail">Event venue (building / landmark)</Label>
        <Input
          id="event_venue_detail"
          name="event_venue_detail"
          defaultValue={initial.event_venue_detail ?? ""}
          disabled={loading}
        />
      </div>
      <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium">Organizer contact</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="organizer_contact_phone">Organizer phone</Label>
            <Input
              id="organizer_contact_phone"
              name="organizer_contact_phone"
              type="tel"
              defaultValue={initial.organizer_contact_phone ?? ""}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizer_contact_email">Organizer email</Label>
            <Input
              id="organizer_contact_email"
              name="organizer_contact_email"
              type="email"
              defaultValue={initial.organizer_contact_email ?? ""}
              disabled={loading}
            />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="beneficiaries_impacted">Beneficiaries (estimate)</Label>
        <Input
          id="beneficiaries_impacted"
          name="beneficiaries_impacted"
          type="number"
          min={0}
          defaultValue={initial.beneficiaries_impacted}
          disabled={loading}
        />
      </div>
      <CampaignCoverImageField
        key={initial.cover_image_url ?? "no-cover"}
        idPrefix="admin_edit"
        defaultUrl={initial.cover_image_url}
        disabled={loading}
        selectedFile={coverFile}
        onSelectedFileChange={setCoverFile}
      />
      {fundingNeeded && (
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="micro_donation_units">Micro donations JSON</Label>
          <Textarea
            id="micro_donation_units"
            name="micro_donation_units"
            rows={3}
            defaultValue={initial.micro_donation_units}
            disabled={loading}
          />
        </div>
      )}
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="impact_metrics">Impact metrics JSON</Label>
        <Textarea id="impact_metrics" name="impact_metrics" rows={3} defaultValue={initial.impact_metrics} disabled={loading} />
      </div>

      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save campaign"}
        </Button>
      </div>
    </form>
  )
}
