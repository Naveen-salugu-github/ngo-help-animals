import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { createNgoProfile } from "@/app/actions/ngo"
import { NgoCreateCampaignForm } from "@/components/dashboard/ngo-create-campaign-form"

export const metadata = { title: "NGO dashboard | Soul Space" }

export default async function NgoDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/ngo")

  const { data: profile } = await supabase.from("users").select("role, name, email").eq("id", user.id).single()
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

  const projectList = projects ?? []
  const projectIds = projectList.map((p) => p.id)
  const { data: impactRows } =
    projectIds.length > 0
      ? await supabase
          .from("impact_updates")
          .select("id, project_id, caption, created_at")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false })
      : { data: [] }

  const postsByProject = new Map<string, { id: string; caption: string; created_at: string }[]>()
  for (const row of impactRows ?? []) {
    const arr = postsByProject.get(row.project_id) ?? []
    arr.push({
      id: row.id,
      caption: row.caption ?? "",
      created_at: row.created_at,
    })
    postsByProject.set(row.project_id, arr)
  }

  const ngoWelcome =
    profile?.name?.trim() || profile?.email?.split("@")[0] || "there"

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome, {ngoWelcome}</h1>
        <p className="mt-2 text-lg text-muted-foreground">NGO dashboard</p>
        <p className="mt-1 text-muted-foreground">
          Register your organization, publish campaigns, and share field updates from{" "}
          <Link href="/dashboard/ngo/impact-updates" className="text-primary underline">
            Impact updates
          </Link>
          .
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

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/dashboard/ngo/impact-updates">Post impact update</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/feed">View impact feed</Link>
            </Button>
          </div>

          <Card id="create-campaign">
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>
                Use the toggle if the campaign only needs volunteers or awareness: no funding goal or public Donate
                button.
                Otherwise micro-donations JSON is optional (defaults apply if empty).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NgoCreateCampaignForm userId={user.id} />
            </CardContent>
          </Card>

          <Separator />

          <div id="your-projects">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold">Your projects</h2>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/ngo/impact-updates">Post impact update</Link>
              </Button>
            </div>
            {projectList.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No campaigns yet. Use <strong>Create project</strong> above to add one.
              </p>
            ) : (
              <ul className="space-y-4">
                {projectList.map((p) => {
                  const posts = postsByProject.get(p.id) ?? []
                  const cap = (s: string) => (s.length > 100 ? `${s.slice(0, 100)}…` : s)
                  return (
                    <li key={p.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-semibold">{p.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.status === "pending_review" ? (
                              <span className="text-amber-700 dark:text-amber-500">Awaiting admin approval</span>
                            ) : (
                              <span className="capitalize">{p.status.replace(/_/g, " ")}</span>
                            )}
                            {p.funding_needed === false ? (
                              <span>, no online funding</span>
                            ) : (
                              <>, goal ₹{Number(p.goal_amount).toLocaleString("en-IN")}</>
                            )}
                            {p.status === "pending_review" && (
                              <span className="block text-xs">
                                Only you can open the project page until it is published.
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {posts.length} impact post{posts.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <Button asChild variant="link" size="sm" className="h-auto shrink-0 self-start px-0 sm:self-center">
                          <Link href={`/projects/${p.id}`}>View campaign</Link>
                        </Button>
                      </div>
                      {posts.length > 0 && (
                        <ul className="mt-3 space-y-2 border-t pt-3 text-sm">
                          {posts.slice(0, 5).map((post) => (
                            <li key={post.id}>
                              <span className="text-foreground">{cap(post.caption) || "(no caption)"}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {new Date(post.created_at).toLocaleDateString(undefined, {
                                  dateStyle: "medium",
                                })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
