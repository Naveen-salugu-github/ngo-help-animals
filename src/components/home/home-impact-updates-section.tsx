import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { HomeImpactUpdateForm } from "@/components/home/home-impact-update-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Props = { userId: string }

export async function HomeImpactUpdatesSection({ userId }: Props) {
  const supabase = await createClient()
  const { data: ngo } = await supabase.from("ngos").select("id").eq("user_id", userId).single()
  if (!ngo) return null

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title")
    .eq("ngo_id", ngo.id)
    .order("created_at", { ascending: false })

  const list = projects ?? []

  return (
    <section id="impact-updates" className="border-t bg-muted/30 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Impact updates</h2>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Post field photos or videos for one of your campaigns. They go live on the impact feed and project pages
            as soon as you submit.
          </p>
        </div>

        {list.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Create a campaign from your{" "}
              <Link href="/dashboard/ngo#create-campaign" className="text-primary underline">
                NGO dashboard
              </Link>{" "}
              first, then you can add updates here.
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>New impact post</CardTitle>
              <CardDescription>Choose a project, add media URL and caption.</CardDescription>
            </CardHeader>
            <CardContent>
              <HomeImpactUpdateForm projects={list} />
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
