"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProject } from "@/app/actions/ngo"
import { uploadCampaignCoverImage } from "@/lib/campaign-cover-upload"
import { CampaignCoverImageField } from "@/components/dashboard/campaign-cover-image-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type Props = { userId: string }

export function NgoCreateCampaignForm({ userId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fundingNeeded, setFundingNeeded] = useState(true)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const sub = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const fd = new FormData(form)

    if (coverFile) {
      const up = await uploadCampaignCoverImage(userId, coverFile)
      if (!up.ok) {
        toast.error(up.error)
        setLoading(false)
        return
      }
      fd.set("cover_image_url", up.publicUrl)
    }
    // Do not rely on `new FormData(form, submitter)`; set explicitly for broad browser/React compatibility.
    if (sub?.name === "status" && sub.value) {
      fd.set("status", sub.value)
    } else {
      fd.set("status", "pending")
    }
    try {
      const result = await createProject(fd)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (result.submittedForReview) {
        toast.success("Campaign submitted for admin review.")
        router.push("/?campaignSubmitted=1")
        router.refresh()
        form.reset()
        setCoverFile(null)
      } else {
        toast.success("Draft saved.")
        router.refresh()
        setCoverFile(null)
      }
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="funding_needed" value={fundingNeeded ? "true" : "false"} />
      <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <Checkbox
          id="campaign-funding-needed"
          checked={fundingNeeded}
          onCheckedChange={(v) => setFundingNeeded(v === true)}
          disabled={loading}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="campaign-funding-needed" className="cursor-pointer font-medium leading-snug">
            This campaign needs online donations
          </Label>
          <p className="text-xs text-muted-foreground">
            Turn off for volunteer-only or awareness campaigns: no funding goal or public Donate button after approval.
          </p>
        </div>
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required disabled={loading} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={4} required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" name="location" required disabled={loading} />
      </div>
      {fundingNeeded && (
        <div className="space-y-2">
          <Label htmlFor="goal_amount">Goal amount (INR)</Label>
          <Input id="goal_amount" name="goal_amount" type="number" min={1} required={fundingNeeded} disabled={loading} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="volunteer_slots">Volunteer slots</Label>
        <Input id="volunteer_slots" name="volunteer_slots" type="number" min={0} defaultValue={0} disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="volunteer_category">Volunteer category</Label>
        <Input id="volunteer_category" name="volunteer_category" placeholder="e.g. Environment" disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="latitude">Latitude (map)</Label>
        <Input id="latitude" name="latitude" type="number" step="any" placeholder="17.6868" disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="longitude">Longitude</Label>
        <Input id="longitude" name="longitude" type="number" step="any" placeholder="83.2185" disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="campaign_date">Date of campaign</Label>
        <Input id="campaign_date" name="campaign_date" type="date" disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event_start_time">Start time</Label>
        <Input id="event_start_time" name="event_start_time" type="time" disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="event_end_time">Ending time</Label>
        <Input id="event_end_time" name="event_end_time" type="time" disabled={loading} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="event_venue_detail">Event venue (building / landmark)</Label>
        <Input
          id="event_venue_detail"
          name="event_venue_detail"
          placeholder="e.g. RK Beach meeting point, near Submarine Museum"
          disabled={loading}
        />
      </div>
      <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium">Organizer contact for this campaign</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Shown when supporters use &quot;Contact organizer&quot; and when they register for the event. Required before
          submitting for review; optional if you save a draft first.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="organizer_contact_phone">Organizer phone</Label>
            <Input
              id="organizer_contact_phone"
              name="organizer_contact_phone"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organizer_contact_email">Organizer email</Label>
            <Input
              id="organizer_contact_email"
              name="organizer_contact_email"
              type="email"
              placeholder="events@your-ngo.org"
              autoComplete="email"
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
          defaultValue={0}
          disabled={loading}
        />
      </div>
      <CampaignCoverImageField
        idPrefix="ngo_create"
        defaultUrl={null}
        disabled={loading}
        selectedFile={coverFile}
        onSelectedFileChange={setCoverFile}
      />
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Submitting for publication sends the campaign to admin review. It appears on Explore after approval
        {fundingNeeded ? " and can accept donations if enabled on the platform." : " (no public donate button for this campaign)."}
      </p>
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" name="status" value="pending" disabled={loading}>
          {loading ? "Submitting…" : "Submit for review"}
        </Button>
        <Button type="submit" name="status" value="draft" variant="secondary" disabled={loading}>
          Save draft
        </Button>
      </div>
    </form>
  )
}
