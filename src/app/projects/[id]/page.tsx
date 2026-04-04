import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/server"
import { getSiteUrl } from "@/lib/env"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { DonateButton } from "@/components/projects/donate-button"
import { VolunteerEventRegistration } from "@/components/projects/volunteer-event-registration"
import { VolunteerCheckIn } from "@/components/projects/volunteer-check-in"
import { EventShareRow } from "@/components/projects/event-share-row"
import { ContactOrganizerDialog } from "@/components/projects/contact-organizer-dialog"
import { PostEventFeedbackDialog } from "@/components/projects/post-event-feedback-dialog"
import { campaignAcceptsOrganizerContact, eventHasFinished } from "@/lib/campaign-utils"
import { BadgeCheck, Users, HeartHandshake, CalendarClock, MapPinned } from "lucide-react"
import type { MicroDonationUnit } from "@/types/database"

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("projects").select("title").eq("id", id).single()
  return { title: data?.title ? `${data.title} | ImpactBridge` : "Project | ImpactBridge" }
}

export default async function ProjectDetailPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      ngos:ngo_id (
        id,
        organization_name,
        verification_status,
        description
      )
    `
    )
    .eq("id", id)
    .single()

  if (error || !project) {
    notFound()
  }

  const { data: sponsors } = await supabase
    .from("sponsorships")
    .select(
      `
      amount,
      campaign_title,
      brands:brand_id (
        company_name,
        logo_url
      )
    `
    )
    .eq("project_id", id)

  const { data: myVolunteer } =
    user && project
      ? await supabase
          .from("volunteers")
          .select("status")
          .eq("user_id", user.id)
          .eq("project_id", id)
          .maybeSingle()
      : { data: null }

  const { data: myFeedback } =
    user && project
      ? await supabase
          .from("project_feedback")
          .select("rating, comment")
          .eq("user_id", user.id)
          .eq("project_id", id)
          .maybeSingle()
      : { data: null }

  const { data: updates } = await supabase
    .from("impact_updates")
    .select("id, media_url, media_type, caption, created_at, moderation_status")
    .eq("project_id", id)
    .order("created_at", { ascending: false })
    .limit(12)

  const ngoRaw = project.ngos as unknown
  const ngo = (Array.isArray(ngoRaw) ? ngoRaw[0] : ngoRaw) as {
    id: string
    organization_name: string
    verification_status: string
    description: string | null
  }

  const pct =
    project.goal_amount > 0
      ? Math.min(100, Math.round((Number(project.funds_raised) / Number(project.goal_amount)) * 100))
      : 0

  const microUnits = (project.micro_donation_units ?? []) as MicroDonationUnit[]
  const cover =
    project.cover_image_url ??
    "https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&q=80"

  const metrics = project.impact_metrics as Record<string, string | number> | null

  const sharePageUrl = `${getSiteUrl()}/projects/${id}`
  const slots = Number(project.volunteer_slots) || 0
  const filled = Number(project.volunteer_count) || 0
  const spotsLeft = Math.max(0, slots - filled)
  const registrationFull = slots > 0 && filled >= slots

  const eventStart = project.event_start_at as string | null | undefined
  const eventEnd = project.event_end_at as string | null | undefined
  const eventVenueDetail = project.event_venue_detail as string | null | undefined

  const eventWhen =
    eventStart != null
      ? eventEnd != null
        ? `${format(new Date(eventStart), "PPP p")} → ${format(new Date(eventEnd), "p")}`
        : format(new Date(eventStart), "PPP p")
      : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-2xl border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- NGO-supplied URLs (e.g. Google Photos) often break with next/image */}
        <img
          src={cover}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          {ngo?.verification_status === "verified" && (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified NGO
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{project.location}</p>
        <p className="text-sm font-medium">{ngo?.organization_name}</p>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Share this event</p>
        <EventShareRow url={sharePageUrl} title={project.title} description={project.location} />
      </div>

      {project.status === "active" && campaignAcceptsOrganizerContact(eventEnd) && (
        <Card id="contact-organizer" className="mt-6 border-primary/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Contact the organizer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Logged-in supporters can send a message to <strong className="text-foreground">{ngo?.organization_name}</strong>{" "}
              about this campaign (timing, accessibility, what to bring). You’ll be prompted to sign in if needed.
            </p>
            <ContactOrganizerDialog
              projectId={project.id}
              projectTitle={project.title}
              ngoName={ngo?.organization_name ?? "Organizer"}
            />
          </CardContent>
        </Card>
      )}

      {project.status === "active" && eventHasFinished(eventEnd) && (
        <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">How was the event?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This campaign’s listed end time has passed. Share quick feedback (optional stars + a short note) to help the NGO
              improve future events.
            </p>
            <PostEventFeedbackDialog
              projectId={project.id}
              projectTitle={project.title}
              initialRating={myFeedback?.rating ?? null}
              initialComment={myFeedback?.comment ?? null}
            />
          </CardContent>
        </Card>
      )}

      {slots > 0 && (
        <Card className="mt-6 border-primary/20 bg-accent/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" />
              Volunteer event
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {eventWhen && (
              <p>
                <span className="font-medium text-foreground">When: </span>
                {eventWhen} <span className="text-muted-foreground">(your timezone)</span>
              </p>
            )}
            <p className="flex flex-wrap items-start gap-2">
              <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>
                <span className="font-medium text-foreground">Where: </span>
                {project.location}
                {eventVenueDetail ? ` — ${eventVenueDetail}` : ""}
              </span>
            </p>
            <p className="pt-1">
              <span className="font-medium text-foreground">Registrations: </span>
              {filled} / {slots}
              {spotsLeft > 0 ? (
                <Badge variant="secondary" className="ml-2">
                  {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-2">
                  Full
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {sponsors && sponsors.length > 0 && (
        <Card className="mt-6 border-primary/20 bg-accent/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Powered by partners</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {sponsors.map((s) => {
              const br = s.brands as unknown
              const b = (Array.isArray(br) ? br[0] : br) as {
                company_name: string
                logo_url: string | null
              } | null
              return (
                <div key={`${s.campaign_title}-${b?.company_name}`} className="flex items-center gap-3">
                  {b?.logo_url && (
                    <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-background">
                      <Image src={b.logo_url} alt="" fill className="object-contain p-1" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{b?.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.campaign_title ?? "CSR sponsorship"} · ₹{Number(s.amount).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About this project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p className="text-foreground">{project.description}</p>
            {ngo?.description && <p>{ngo.description}</p>}
            {(project.timeline_start || project.timeline_end) && (
              <p>
                <span className="font-medium text-foreground">
                  {project.timeline_end ? "Campaign period: " : "Campaign date: "}
                </span>
                {project.timeline_start ?? "—"}
                {project.timeline_end ? ` → ${project.timeline_end}` : ""}
              </p>
            )}
            {metrics && Object.keys(metrics).length > 0 && (
              <div>
                <p className="mb-2 font-medium text-foreground">Impact metrics</p>
                <ul className="list-inside list-disc space-y-1">
                  {Object.entries(metrics).map(([k, v]) => (
                    <li key={k}>
                      {k}: {String(v)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={pct} className="h-3" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Raised</p>
                <p className="font-semibold">₹{Number(project.funds_raised).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Goal</p>
                <p className="font-semibold">₹{Number(project.goal_amount).toLocaleString("en-IN")}</p>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                <span>{project.donor_count} donors</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {filled}/{slots} volunteers registered
                </span>
              </div>
            </div>
            {project.status === "active" && (
              <DonateButton projectId={project.id} units={microUnits} />
            )}
            {project.status === "active" && slots > 0 && (
              <div className="flex flex-col gap-2">
                {myVolunteer &&
                  (myVolunteer.status === "rsvp" ||
                    myVolunteer.status === "confirmed" ||
                    myVolunteer.status === "checked_in") && (
                    <Badge className="w-fit" variant="outline">
                      You’re registered for this event
                    </Badge>
                  )}
                {(!myVolunteer || myVolunteer.status === "cancelled") && (
                  <VolunteerEventRegistration
                    projectId={project.id}
                    disabled={registrationFull}
                    fullMessage="Registration is full — no more spots available."
                  />
                )}
                {myVolunteer &&
                  (myVolunteer.status === "rsvp" || myVolunteer.status === "confirmed") && (
                    <VolunteerCheckIn projectId={project.id} />
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-10" />

      <section>
        <h2 className="mb-4 text-xl font-semibold">Impact timeline</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(updates ?? []).map((u) => (
            <Card key={u.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {u.media_type === "video" ? (
                  <video src={u.media_url} className="h-full w-full object-cover" controls />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.media_url}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-sm">{u.caption}</p>
                {u.moderation_status !== "approved" && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {u.moderation_status}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        {(updates ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Field updates will appear here as the NGO posts them.</p>
        )}
      </section>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        <Link href="/projects" className="underline">
          Back to all projects
        </Link>
      </p>
    </div>
  )
}
