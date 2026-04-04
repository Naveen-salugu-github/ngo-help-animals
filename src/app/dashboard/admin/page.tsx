import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { setNgoVerification, setImpactModeration } from "@/app/actions/admin"
import { AdminDeleteProjectButton } from "@/components/dashboard/admin-delete-project-button"
import Link from "next/link"

export const metadata = { title: "Admin | ImpactBridge" }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/admin")

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>Admin only. Your role: {profile?.role ?? "unknown"}.</p>
      </div>
    )
  }

  const { data: pendingNgos } = await supabase
    .from("ngos")
    .select("id, organization_name, verification_status, created_at, user_id")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: false })

  const { data: pendingImpact } = await supabase
    .from("impact_updates")
    .select(
      `
      id,
      caption,
      media_url,
      moderation_status,
      created_at,
      projects:project_id ( title, ngos:ngo_id ( organization_name ) )
    `
    )
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: false })

  const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true })
  const { count: projectCount } = await supabase.from("projects").select("*", { count: "exact", head: true })
  const { count: donationRows } = await supabase.from("donations").select("*", { count: "exact", head: true })

  const { data: allProjects } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      status,
      location,
      created_at,
      ngos:ngo_id ( organization_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">Verify NGOs, approve impact posts, monitor platform health.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Users</CardDescription>
            <CardTitle className="text-2xl">{userCount ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projects</CardDescription>
            <CardTitle className="text-2xl">{projectCount ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Donation rows</CardDescription>
            <CardTitle className="text-2xl">{donationRows ?? "—"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>NGO verification</CardTitle>
          <CardDescription>Review registration before granting verified badges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(pendingNgos ?? []).length === 0 && <p className="text-sm text-muted-foreground">No pending NGOs.</p>}
          {(pendingNgos ?? []).map((n) => {
            return (
              <div key={n.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{n.organization_name}</p>
                  <p className="text-xs text-muted-foreground">Owner user id: {n.user_id}</p>
                  <Badge variant="outline" className="mt-2">
                    {n.verification_status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={setNgoVerification}>
                    <input type="hidden" name="ngo_id" value={n.id} />
                    <input type="hidden" name="verification_status" value="verified" />
                    <Button type="submit" size="sm">
                      Verify
                    </Button>
                  </form>
                  <form action={setNgoVerification}>
                    <input type="hidden" name="ngo_id" value={n.id} />
                    <input type="hidden" name="verification_status" value="rejected" />
                    <Button type="submit" size="sm" variant="destructive">
                      Reject
                    </Button>
                  </form>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact moderation</CardTitle>
          <CardDescription>Approve posts for the public feed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {(pendingImpact ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No posts awaiting review.</p>
          )}
          {(pendingImpact ?? []).map((post) => {
            const raw = post.projects as unknown
            const proj = (Array.isArray(raw) ? raw[0] : raw) as {
              title: string
              ngos: { organization_name: string } | { organization_name: string }[] | null
            } | null
            const ngoRaw = proj?.ngos
            const ngo = Array.isArray(ngoRaw) ? ngoRaw[0] : ngoRaw
            return (
              <div key={post.id} className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">{ngo?.organization_name}</p>
                <p className="text-xs text-muted-foreground">{proj?.title}</p>
                <p className="text-sm">{post.caption}</p>
                <a href={post.media_url} className="text-xs text-primary underline" target="_blank" rel="noreferrer">
                  Media link
                </a>
                <div className="flex flex-wrap gap-2">
                  <form action={setImpactModeration}>
                    <input type="hidden" name="impact_id" value={post.id} />
                    <input type="hidden" name="moderation_status" value="approved" />
                    <Button type="submit" size="sm">
                      Approve
                    </Button>
                  </form>
                  <form action={setImpactModeration}>
                    <input type="hidden" name="impact_id" value={post.id} />
                    <input type="hidden" name="moderation_status" value="rejected" />
                    <Button type="submit" size="sm" variant="outline">
                      Reject
                    </Button>
                  </form>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns (projects)</CardTitle>
          <CardDescription>
            Remove a campaign from the platform. This deletes the project and related volunteers, donations records,
            impact updates, and sponsorships (database cascades).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(allProjects ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No projects yet.</p>
          )}
          {(allProjects ?? []).map((p) => {
            const raw = p.ngos as unknown
            const ngo = (Array.isArray(raw) ? raw[0] : raw) as { organization_name: string } | null
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ngo?.organization_name ?? "NGO"} · {p.location} · {p.status}
                  </p>
                  <Link href={`/projects/${p.id}`} className="mt-1 inline-block text-xs text-primary underline">
                    View public page
                  </Link>
                </div>
                <AdminDeleteProjectButton projectId={p.id} title={p.title} />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
