import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrandProfile, sponsorProject } from "@/app/actions/brand"
import { BrandCsrClient } from "@/components/dashboard/brand-csr-client"

export const metadata = { title: "Brand dashboard | Soul Space" }

export default async function BrandDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/brand")

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "brand") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p>This dashboard is for brand accounts. Your role: {profile?.role ?? "unknown"}.</p>
      </div>
    )
  }

  const { data: brand } = await supabase.from("brands").select("*").eq("user_id", user.id).single()
  const { data: activeProjects } = await supabase
    .from("projects")
    .select("id, title, location, funds_raised, goal_amount")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50)

  let totalSponsored = 0
  let projectCount = 0
  let beneficiaryHint = 0
  if (brand) {
    const { data: sp } = await supabase.from("sponsorships").select("amount, project_id").eq("brand_id", brand.id)
    projectCount = new Set((sp ?? []).map((s) => s.project_id)).size
    totalSponsored = (sp ?? []).reduce((a, s) => a + Number(s.amount), 0)
    const ids = Array.from(new Set((sp ?? []).map((s) => s.project_id)))
    if (ids.length) {
      const { data: projs } = await supabase
        .from("projects")
        .select("beneficiaries_impacted")
        .in("id", ids)
      beneficiaryHint = (projs ?? []).reduce((a, p) => a + (p.beneficiaries_impacted ?? 0), 0)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold">Brand CSR dashboard</h1>
        <p className="text-muted-foreground">
          Sponsor verified projects, co-brand campaigns, and export narrative summaries for reporting.
        </p>
      </div>

      {!brand && (
        <Card>
          <CardHeader>
            <CardTitle>Brand profile</CardTitle>
            <CardDescription>Logo URL can point to Supabase Storage bucket brand-assets.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBrandProfile} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company name</Label>
                <Input id="company_name" name="company_name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input id="logo_url" name="logo_url" placeholder="https://cdn.soulspace.org/brands/company-logo.png" />
              </div>
              <Button type="submit">Save brand</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {brand && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total sponsored</CardDescription>
                <CardTitle className="text-2xl">₹{totalSponsored.toLocaleString("en-IN")}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Projects</CardDescription>
                <CardTitle className="text-2xl">{projectCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Beneficiaries (sum on sponsored projects)</CardDescription>
                <CardTitle className="text-2xl">{beneficiaryHint.toLocaleString("en-IN")}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <BrandCsrClient brandName={brand.company_name} totals={`Total sponsored: ₹${totalSponsored}\nProjects: ${projectCount}\nBeneficiaries (reported): ${beneficiaryHint}`} />

          <Card>
            <CardHeader>
              <CardTitle>Sponsor a project</CardTitle>
              <CardDescription>Your logo and campaign title appear on the project page and feed context.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={sponsorProject} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="project_id">Project</Label>
                  <select
                    id="project_id"
                    name="project_id"
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select…</option>
                    {(activeProjects ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} · {p.location}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (INR)</Label>
                  <Input id="amount" name="amount" type="number" min={1} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaign_title">Campaign title</Label>
                  <Input id="campaign_title" name="campaign_title" placeholder="Stray Animal Care Drive powered by Acme Foundation" />
                </div>
                <Button type="submit" className="sm:col-span-2 w-fit">
                  Confirm sponsorship
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
