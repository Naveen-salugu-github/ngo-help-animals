import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, HandHeart } from "lucide-react"

export function JoinMovementSection() {
  return (
    <section
      id="join-movement"
      className="scroll-mt-24 border-y bg-gradient-to-r from-primary/12 via-accent/30 to-primary/10 py-16 backdrop-blur-md md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 text-center" data-gsap-reveal>
        <HandHeart className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Join the movement</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Explore live campaigns, volunteer near you, or bring your organization onto Soul Space to publish verified
          impact.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/projects">
              Explore projects <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/volunteer-map">Volunteer map</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/register?role=ngo">Register an NGO</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
