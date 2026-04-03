import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { createNgoProfile, createProject, createImpactUpdate } from "@/app/actions/ngo"
import { AiCaptionButton } from "@/components/dashboard/ai-caption-button"

export const metadata = { title: "NGO dashboard | ImpactBridge" }

export default async function NgoDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/ngo")

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "ngo") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>This dashboard is for NGO accounts. Your role: {profile?.role ?? "unknown"}.</p>
      </div>
    )
  }

  const { data: ngo } = await supabase.from("ngos").select("*").eq("user_id", user.id).single()
  const { data: projects } = ngo
    ? await supabase.from("projects").select("*").eq("ngo_id", ngo.id).order("created_at", { ascending: false })
    : { data: [] }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">NGO dashboard</h1>
        <p className="text-muted-foreground">
          Register your organization, publish projects, and share field impact updates.
        </p>
      </div>

      {!ngo && (
        <Card>
          <CardHeader>
            <CardTitle>Organization profile</CardTitle>
            <CardDescription>
              Submit details for admin verification (80G / 12A documents can be uploaded via Supabase Storage
              bucket <code className="text-xs">ngo-docs</code>).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createNgoProfile} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="organization_name">Organization name</Label>
                <Input id="organization_name" name="organization_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration number</Label>
                <Input id="registration_number" name="registration_number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN</Label>
                <Input id="pan_number" name="pan_number" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" />
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description">About</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <Button type="submit" className="sm:col-span-2 w-fit">
                Save NGO profile
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {ngo && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{ngo.organization_name}</CardTitle>
              <CardDescription>
                Verification: <strong>{ngo.verification_status}</strong>
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>
                Micro-donations JSON optional — default units are pre-filled server-side if empty.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createProject} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal_amount">Goal amount (INR)</Label>
                  <Input id="goal_amount" name="goal_amount" type="number" min={1} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer_slots">Volunteer slots</Label>
                  <Input id="volunteer_slots" name="volunteer_slots" type="number" min={0} defaultValue={0} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volunteer_category">Volunteer category</Label>
                  <Input id="volunteer_category" name="volunteer_category" placeholder="e.g. Environment" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (map)</Label>
                  <Input id="latitude" name="latitude" type="number" step="any" placeholder="17.6868" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" name="longitude" type="number" step="any" placeholder="83.2185" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline_start">Start date</Label>
                  <Input id="timeline_start" name="timeline_start" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeline_end">End date</Label>
                  <Input id="timeline_end" name="timeline_end" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beneficiaries_impacted">Beneficiaries (estimate)</Label>
                  <Input id="beneficiaries_impacted" name="beneficiaries_impacted" type="number" min={0} defaultValue={0} />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="cover_image_url">Cover image URL</Label>
                  <Input id="cover_image_url" name="cover_image_url" placeholder="https://…" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="micro_donation_units">Micro donations JSON (optional)</Label>
                  <Textarea
                    id="micro_donation_units"
                    name="micro_donation_units"
                    rows={3}
                    placeholder='[{"amount":50,"label":"1 meal"},{"amount":200,"label":"1 tree"}]'
                  />
                </div>
                <div className="flex gap-2 sm:col-span-2">
                  <Button type="submit" name="status" value="active">
                    Publish active
                  </Button>
                  <Button type="submit" name="status" value="draft" variant="secondary">
                    Save draft
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Impact update</CardTitle>
              <CardDescription>Posts appear in the feed after admin approval.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createImpactUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project_id">Project</Label>
                  <select
                    id="project_id"
                    name="project_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select…</option>
                    {(projects ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media_url">Photo or video URL</Label>
                  <Input id="media_url" name="media_url" required placeholder="https://…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media_type">Media type</Label>
                  <select id="media_type" name="media_type" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="impact_context">Context for AI (optional)</Label>
                  <Textarea id="impact_context" rows={2} placeholder="Kids receiving midday meals in Vizag…" />
                </div>
                <AiCaptionButton contextFieldId="impact_context" targetFieldId="caption" />
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea id="caption" name="caption" rows={3} />
                </div>
                <Button type="submit">Submit update</Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          <div>
            <h2 className="mb-4 text-xl font-semibold">Your projects</h2>
            <ul className="space-y-2 text-sm">
              {(projects ?? []).map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong> — {p.status} — goal ₹{Number(p.goal_amount).toLocaleString("en-IN")}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
