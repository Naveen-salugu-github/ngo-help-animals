import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "@/app/actions/auth"
import { AvatarUpload } from "@/components/account/avatar-upload"
import { AccountNameForm } from "@/components/account/account-name-form"
import { DONATIONS_ENABLED } from "@/lib/feature-flags"
import { VolunteerCancelRegistration } from "@/components/projects/volunteer-cancel-registration"

export const metadata = { title: "My account | ImpactBridge" }

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/account")

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, role, avatar_url")
    .eq("id", user.id)
    .single()

  const { data: volunteerRows } = await supabase
    .from("volunteers")
    .select(
      `
      id,
      status,
      created_at,
      projects:project_id ( id, title )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const { data: donations } = await supabase
    .from("donations")
    .select(
      `
      id,
      amount,
      currency,
      payment_status,
      micro_unit_label,
      receipt_url,
      created_at,
      projects:project_id (
        id,
        title
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  const displayName = profile?.name?.trim() || user.email?.split("@")[0] || "You"

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My account</h1>
        <p className="mt-1 text-muted-foreground">Profile, photo, and your giving history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How you appear across ImpactBridge.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="text-lg">{(displayName).slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <AvatarUpload userId={user.id} />
              <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP · max 2 MB · stored securely in your folder.</p>
            </div>
          </div>
          <AccountNameForm
            initialName={profile?.name ?? ""}
            email={profile?.email ?? user.email ?? ""}
            role={profile?.role ?? "donor"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My contributions</CardTitle>
          <CardDescription>Donations linked to your account (completed and pending).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(donations ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No donations yet.{" "}
              <Link href="/projects" className="text-primary underline">
                Explore projects
              </Link>{" "}
              {DONATIONS_ENABLED ? "to fund impact." : "to volunteer and follow campaigns."}
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {(donations ?? []).map((d) => {
                const pr = d.projects as unknown
                const project = (Array.isArray(pr) ? pr[0] : pr) as { id: string; title: string } | null
                return (
                  <li key={d.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {project?.title ?? "Project"}
                        {d.micro_unit_label ? (
                          <span className="font-normal text-muted-foreground"> · {d.micro_unit_label}</span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(d.created_at as string).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {d.currency === "INR" ? "₹" : `${d.currency} `}
                        {Number(d.amount).toLocaleString("en-IN")}
                      </span>
                      <Badge variant={d.payment_status === "completed" ? "default" : "outline"}>
                        {d.payment_status}
                      </Badge>
                      {d.receipt_url && (
                        <Button asChild variant="link" size="sm" className="h-auto p-0">
                          <a href={d.receipt_url} target="_blank" rel="noopener noreferrer">
                            Receipt
                          </a>
                        </Button>
                      )}
                      {project?.id && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project.id}`}>Campaign</Link>
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Volunteering</CardTitle>
          <CardDescription>Events you signed up for.</CardDescription>
        </CardHeader>
        <CardContent>
          {(volunteerRows ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No volunteer registrations yet.{" "}
              <Link href="/projects" className="text-primary underline">
                Browse projects
              </Link>{" "}
              with open slots.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {(volunteerRows ?? []).map((v) => {
                const pr = v.projects as unknown
                const project = (Array.isArray(pr) ? pr[0] : pr) as { id: string; title: string } | null
                return (
                  <li key={v.id} className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{project?.title ?? "Project"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.created_at as string).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{v.status}</Badge>
                      {project?.id && (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/projects/${project.id}`}>View</Link>
                        </Button>
                      )}
                      {project?.id && (v.status === "rsvp" || v.status === "confirmed") && (
                        <VolunteerCancelRegistration
                          projectId={project.id}
                          status={v.status}
                          compact
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />

      <form action={signOut}>
        <Button type="submit" variant="destructive">
          Sign out
        </Button>
      </form>
    </div>
  )
}
