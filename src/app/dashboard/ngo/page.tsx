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

export const metadata = { title: "NGO dashboard | ImpactBridge" }

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

  const ngoWelcome =
    profile?.name?.trim() || profile?.email?.split("@")[0] || "there"

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome, {ngoWelcome}</h1>
        <p className="mt-2 text-lg text-muted-foreground">NGO dashboard</p>
        <p className="mt-1 text-muted-foreground">
          Register your organization and publish campaigns. Post impact updates from the home page after you sign in.
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

          <Card id="create-campaign">
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>
                Micro-donations JSON optional — default units are pre-filled server-side if empty.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NgoCreateCampaignForm />
            </CardContent>
          </Card>

          <Separator />

          <div>
            <h2 className="mb-4 text-xl font-semibold">Your projects</h2>
            <ul className="space-y-2 text-sm">
              {(projects ?? []).map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong> —{" "}
                  {p.status === "pending_review" ? (
                    <span className="text-amber-700 dark:text-amber-500">awaiting admin approval</span>
                  ) : (
                    p.status
                  )}{" "}
                  — goal ₹{Number(p.goal_amount).toLocaleString("en-IN")}
                  {p.status === "pending_review" && (
                    <span className="ml-2 text-xs text-muted-foreground">(only you can open the page until published)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
