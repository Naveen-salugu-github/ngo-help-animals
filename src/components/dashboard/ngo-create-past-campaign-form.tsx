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

export function NgoCreatePastCampaignForm({ userId }: Props) {
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
    fd.set("is_past_campaign", "true")
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
        toast.success("Past campaign submitted for admin review.")
        setCoverFile(null)
        form.reset()
        router.push("/dashboard/ngo?pastSubmitted=1")
        router.refresh()
      } else {
        toast.success("Draft saved.")
        router.push("/dashboard/ngo")
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
      <div className="sm:col-span-2 flex items-start gap-3 rounded-lg border border-dashed border-primary/30 bg-muted/30 p-4">
        <Checkbox
          id="past-campaign-funding-needed"
          checked={fundingNeeded}
          onCheckedChange={(v) => setFundingNeeded(v === true)}
          disabled={loading}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="past-campaign-funding-needed" className="cursor-pointer font-medium leading-snug">
            Show funding goal &amp; donations on the public page
          </Label>
          <p className="text-xs text-muted-foreground">
            Turn off for a pure story or impact highlight with no donation ask. Past campaigns never show volunteer
            sign-up or map pins.
          </p>
        </div>
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="past_title">Title</Label>
        <Input id="past_title" name="title" required disabled={loading} />
      </div>
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="past_description">Description</Label>
        <Textarea id="past_description" name="description" rows={4} required disabled={loading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="past_location">Location (area / city)</Label>
        <Input id="past_location" name="location" required disabled={loading} />
      </div>
      {fundingNeeded && (
        <div className="space-y-2">
          <Label htmlFor="past_goal_amount">Goal amount (INR)</Label>
          <Input
            id="past_goal_amount"
            name="goal_amount"
            type="number"
            min={1}
            required={fundingNeeded}
            disabled={loading}
          />
        </div>
      )}
      <div className="sm:col-span-2 space-y-2">
        <Label htmlFor="past_campaign_date">When this work took place (optional)</Label>
        <Input id="past_campaign_date" name="campaign_date" type="date" disabled={loading} />
        <p className="text-xs text-muted-foreground">Stored as the campaign period start; no event or volunteer fields.</p>
      </div>
      <div className="sm:col-span-2 rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-3 text-sm font-medium">Organizer contact</p>
        <p className="mb-3 text-xs text-muted-foreground">
          Required before submitting for review (optional for drafts). Not used for volunteer flows on past campaigns.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="past_organizer_phone">Organizer phone</Label>
            <Input
              id="past_organizer_phone"
              name="organizer_contact_phone"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="past_organizer_email">Organizer email</Label>
            <Input
              id="past_organizer_email"
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
        <Label htmlFor="past_beneficiaries">Beneficiaries (estimate)</Label>
        <Input
          id="past_beneficiaries"
          name="beneficiaries_impacted"
          type="number"
          min={0}
          defaultValue={0}
          disabled={loading}
        />
      </div>
      <CampaignCoverImageField
        idPrefix="ngo_past"
        defaultUrl={null}
        disabled={loading}
        selectedFile={coverFile}
        onSelectedFileChange={setCoverFile}
      />
      <p className="text-xs text-muted-foreground sm:col-span-2">
        Past campaigns are reviewed like other projects. They appear as &quot;Past&quot; on Explore and do not offer
        volunteering or map pins.
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
