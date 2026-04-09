import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react"

export function HomeExtraSections() {
  return (
    <>
      <section className="border-b bg-muted/25 py-16 backdrop-blur-xl md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-12 max-w-2xl" data-gsap-reveal>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Why Soul Space</h2>
            <p className="mt-2 text-muted-foreground">
              Soul Space helps every contribution stay accountable. Donors support verified NGOs, volunteers join nearby
              initiatives, and organizations publish transparent outcomes from the field.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card data-gsap-reveal className="border-primary/15">
              <CardHeader>
                <ShieldCheck className="mb-2 h-8 w-8 text-primary" aria-hidden />
                <CardTitle className="text-lg">Verified NGOs</CardTitle>
                <CardDescription>
                  Every NGO profile includes onboarding details and verification status so supporters can contribute with
                  confidence.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-gsap-reveal className="border-primary/15">
              <CardHeader>
                <Sparkles className="mb-2 h-8 w-8 text-primary" aria-hidden />
                <CardTitle className="text-lg">Transparent impact</CardTitle>
                <CardDescription>
                  Campaign pages show goals, funds raised, media evidence, and milestone updates so supporters can track
                  progress end to end.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card data-gsap-reveal className="border-primary/15">
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" aria-hidden />
                <CardTitle className="text-lg">Community &amp; volunteers</CardTitle>
                <CardDescription>
                  People discover opportunities by location, register for events, and collaborate with brands on
                  measurable social impact.
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
            Discover causes, take action, and follow outcomes in one continuous journey.
          </p>
        </div>
        <ol className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            { step: "1", title: "Explore", body: "Browse live campaigns by cause, urgency, and location." },
            { step: "2", title: "Support", body: "Donate securely or register as a volunteer for upcoming events." },
            { step: "3", title: "Track impact", body: "Review field updates, media, and milestone progress." },
            { step: "4", title: "Amplify", body: "Share campaigns with friends, teams, and CSR partners." },
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
              A transparent system works best when progress is visible and easy to understand.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Verified NGO partners", value: "50+" },
              { label: "Volunteer hours contributed", value: "12k+" },
              { label: "Lives supported", value: "85k+" },
              { label: "Active campaigns", value: "120+" },
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
              Quick answers to common questions before you donate, volunteer, or launch a campaign.
            </p>
            <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Donations:</strong> Contributions are routed to active projects and
                supporters can track updates tied to campaign milestones.
              </li>
              <li>
                <strong className="text-foreground">Volunteering:</strong> Event pages include schedule, check-in details,
                required skills, and on-ground coordinator contact.
              </li>
              <li>
                <strong className="text-foreground">Brands:</strong> CSR teams can partner with NGOs, co-fund initiatives,
                and share outcome-focused reports.
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
                Use location-aware discovery to find nearby causes, upcoming drives, and volunteer events you can join
                this week.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-start gap-2 text-sm text-muted-foreground">
              <Heart className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <p>
                Small, consistent actions from local communities create long-term, measurable change for people and
                animals who need support most.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  )
}
