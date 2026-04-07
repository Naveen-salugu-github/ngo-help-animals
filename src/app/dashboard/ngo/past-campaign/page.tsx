import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { NgoCreatePastCampaignForm } from "@/components/dashboard/ngo-create-past-campaign-form"
import { ImagePlus } from "lucide-react"

export const metadata = { title: "Add past campaign | NGO | Soul Space" }

export default async function NgoPastCampaignPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/ngo/past-campaign")

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "ngo") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>This page is for NGO accounts. Your role: {profile?.role ?? "unknown"}.</p>
      </div>
    )
  }

  const { data: ngo } = await supabase.from("ngos").select("id").eq("user_id", user.id).single()
  if (!ngo) {
    redirect("/dashboard/ngo")
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2 h-8 px-2" asChild>
            <Link href="/dashboard/ngo">← NGO dashboard</Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Add a past campaign</h1>
          <p className="mt-2 text-muted-foreground">
            Record completed work for your profile: no volunteering, map pins, or event scheduling. Appears as
            &quot;Past&quot; when published.
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ImagePlus className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg">Impact photos & videos for past campaigns</CardTitle>
              <CardDescription>
                After a past campaign is published, add field updates the same way as for active projects. They show on
                the impact feed and the campaign&apos;s project page.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary">
            <Link href="/dashboard/ngo/impact-updates">Go to impact updates</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past / historical campaign</CardTitle>
          <CardDescription>
            Same review flow as new projects. Donation tiers use platform defaults when funding is enabled (you set the
            goal only).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NgoCreatePastCampaignForm userId={user.id} />
        </CardContent>
      </Card>
    </div>
  )
}
