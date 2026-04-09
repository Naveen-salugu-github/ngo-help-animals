import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react"

/** Placeholder copy — edit anytime. Extra sections lengthen the landing scroll. */
export function HomeExtraSections() {
  return (
    <>
      <section className="border-b bg-muted/25 py-16 backdrop-blur-xl md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-2xl" data-gsap-reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Why Soul Space</h2>
            <p className="mt-2 text-muted-foreground">
              Placeholder: we&apos;re building a space where donors, volunteers, and NGOs meet with clarity. Replace this
              text with your mission story and proof points.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card data-gsap-reveal className="border-primary/15">
              <CardHeader>
                <ShieldCheck className="mb-2 h-8 w-8 text-primary" aria-hidden />
                <CardTitle className="text-lg">Verified NGOs</CardTitle>
                <CardDescription>
                  Placeholder: vetting and onboarding notes. Add your verification criteria and partner trust signals.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-gsap-reveal className="border-primary/15">
              <CardHeader>
                <Sparkles className="mb-2 h-8 w-8 text-primary" aria-hidden />
                <CardTitle className="text-lg">Transparent impact</CardTitle>
                <CardDescription>
                  Placeholder: funding progress, field media, and impact updates in one place. Tweak copy to match your
                  tone.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-gsap-reveal className="border-primary/15">
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" aria-hidden />
                <CardTitle className="text-lg">Community &amp; volunteers</CardTitle>
                <CardDescription>
                  Placeholder: map-based discovery, events, and CSR partnerships. Edit with real program highlights.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="mb-12 max-w-2xl" data-gsap-reveal>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">How it works</h2>
          <p className="mt-2 text-muted-foreground">
            Placeholder: four simple steps visitors can scan. Replace with your real funnel (explore → support →
            follow-up).
          </p>
        </div>
        <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "1", title: "Explore", body: "Browse campaigns by cause and location. (Placeholder copy.)" },
            { step: "2", title: "Support", body: "Donate or RSVP for a volunteer event. (Placeholder copy.)" },
            { step: "3", title: "Follow impact", body: "See impact updates and reports from the field. (Placeholder.)" },
            { step: "4", title: "Share", body: "Invite friends or partners to amplify impact. (Placeholder.)" },
          ].map((item) => (
            <li key={item.step} data-gsap-reveal className="relative rounded-xl border bg-card p-6 shadow-sm">
              <span className="text-3xl font-bold text-primary/40">{item.step}</span>
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y bg-gradient-to-b from-accent/35 to-background/90 py-16 backdrop-blur-md md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-2xl" data-gsap-reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Impact snapshot</h2>
            <p className="mt-2 text-muted-foreground">
              Placeholder metrics — replace with live totals from your Supabase aggregates or marketing numbers.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "NGO partners (placeholder)", value: "—" },
              { label: "Volunteer hours (placeholder)", value: "—" },
              { label: "Beneficiaries reached (placeholder)", value: "—" },
              { label: "Campaigns live (placeholder)", value: "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                data-gsap-reveal
                className="rounded-2xl border border-primary/20 bg-background/80 p-6 text-center shadow-sm backdrop-blur"
              >
                <p className="text-3xl font-bold tracking-tight text-primary">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid gap-10 gap-y-12 lg:grid-cols-2 lg:items-start">
          <div data-gsap-reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Notes &amp; FAQs</h2>
            <p className="mt-2 text-muted-foreground">
              Placeholder: short answers to common questions. Swap for your real support and policy links.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Donations:</strong> placeholder — how funds flow, receipts, and
                refunds.
              </li>
              <li>
                <strong className="text-foreground">Volunteering:</strong> placeholder — RSVP, check-in, and safety.
              </li>
              <li>
                <strong className="text-foreground">Brands:</strong> placeholder — CSR sponsorships and reporting.
              </li>
            </ul>
          </div>
          <Card data-gsap-reveal className="border-dashed border-primary/30 bg-muted/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-lg">Local discovery</CardTitle>
              </div>
              <CardDescription>
                Placeholder: explain how location helps sort projects and events. Link to your volunteer map when ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-start gap-2 text-sm text-muted-foreground">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <p>
                Placeholder: one more emotional line about why community support matters. Edit to match your
                voice-over copy.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}
