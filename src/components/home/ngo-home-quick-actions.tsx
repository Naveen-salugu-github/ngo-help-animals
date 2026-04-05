import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DONATIONS_ENABLED } from "@/lib/feature-flags"
import { Compass, HeartHandshake, ImagePlus, Sparkles } from "lucide-react"

/** Logged-in NGO users only — not shown for donor, admin, or brand. */
export function NgoHomeQuickActions() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Make an impact</CardTitle>
        <CardDescription>
          Publish campaigns from your NGO dashboard, or explore other projects on the platform
          {DONATIONS_ENABLED ? " and fund them when donations are open." : "."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg" className="flex-1 gap-2 sm:min-w-[200px]">
            <Link href="/projects">
              {DONATIONS_ENABLED ? (
                <>
                  <HeartHandshake className="h-5 w-5" />
                  Donate &amp; support projects
                </>
              ) : (
                <>
                  <Compass className="h-5 w-5" />
                  Explore projects
                </>
              )}
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1 gap-2 sm:min-w-[200px]">
            <Link href="/dashboard/ngo#create-campaign">
              <Sparkles className="h-5 w-5" />
              Create a campaign
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1 gap-2 sm:min-w-[200px]">
            <Link href="/dashboard/ngo/impact-updates">
              <ImagePlus className="h-5 w-5" />
              Post impact update
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
