import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { createImpactUpdate } from "@/app/actions/ngo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AiCaptionButton } from "@/components/dashboard/ai-caption-button"

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
            Post field photos or videos for one of your campaigns. The public impact feed shows them after admin approval.
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
              <form action={createImpactUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="home_impact_project_id">Project</Label>
                  <select
                    id="home_impact_project_id"
                    name="project_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select…</option>
                    {list.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home_impact_media_url">Photo or video URL</Label>
                  <Input id="home_impact_media_url" name="media_url" required placeholder="https://…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home_impact_media_type">Media type</Label>
                  <select
                    id="home_impact_media_type"
                    name="media_type"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="home_impact_context">Context for AI (optional)</Label>
                  <Textarea id="home_impact_context" rows={2} placeholder="Kids receiving midday meals in Vizag…" />
                </div>
                <AiCaptionButton contextFieldId="home_impact_context" targetFieldId="home_impact_caption" />
                <div className="space-y-2">
                  <Label htmlFor="home_impact_caption">Caption</Label>
                  <Textarea id="home_impact_caption" name="caption" rows={3} />
                </div>
                <Button type="submit">Submit update</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
