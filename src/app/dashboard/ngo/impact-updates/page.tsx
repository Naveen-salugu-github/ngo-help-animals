import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NgoImpactUpdateForm } from "@/components/dashboard/ngo-impact-update-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ImagePlus } from "lucide-react"

export const metadata = { title: "Impact updates | NGO dashboard | Soul Space" }

export default async function NgoImpactUpdatesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/ngo/impact-updates")

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "ngo") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>This page is for NGO accounts. Your role: {profile?.role ?? "unknown"}.</p>
        <Button asChild className="mt-4">
          <Link href="/">Home</Link>
        </Button>
      </div>
    )
  }

  const { data: ngo } = await supabase.from("ngos").select("id").eq("user_id", user.id).single()

  if (!ngo) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <Button asChild variant="ghost" size="sm" className="gap-1 px-0">
          <Link href="/dashboard/ngo">
            <ArrowLeft className="h-4 w-4" />
            Back to NGO dashboard
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Complete your NGO profile first</CardTitle>
            <CardDescription>
              Add your organization on the dashboard, then you can publish impact posts for your campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/ngo">Go to NGO dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, is_past_campaign")
    .eq("ngo_id", ngo.id)
    .order("created_at", { ascending: false })

  const list = projects ?? []

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 gap-1 px-0">
            <Link href="/dashboard/ngo#your-projects">
              <ArrowLeft className="h-4 w-4" />
              Back to NGO dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ImagePlus className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Impact updates</h1>
              <p className="text-muted-foreground">
                Share field photos or videos for your campaigns. They appear on the impact feed and project pages.
                Past and historical campaigns are listed under &quot;Past / historical&quot; in the project menu.
              </p>
            </div>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Create a campaign from your{" "}
            <Link href="/dashboard/ngo#create-campaign" className="text-primary underline">
              NGO dashboard
            </Link>{" "}
            first, then you can add impact posts here.
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>New impact post</CardTitle>
            <CardDescription>
              Choose a project, add a caption, then upload several photos or videos at once or paste a single media link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NgoImpactUpdateForm projects={list} userId={user.id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
