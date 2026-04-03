import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Params = { params: Promise<{ id: string }> }

export default async function ReceiptPage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/receipts/${id}`)

  const { data: donation } = await supabase
    .from("donations")
    .select(
      `
      id,
      project_id,
      amount,
      currency,
      payment_status,
      micro_unit_label,
      razorpay_payment_id,
      created_at,
      projects:project_id ( title )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!donation) {
    notFound()
  }

  const pr = donation.projects as unknown
  const project = (Array.isArray(pr) ? pr[0] : pr) as { title: string } | null

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Donation receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Project: </span>
            {project?.title}
          </p>
          <p>
            <span className="text-muted-foreground">Amount: </span>₹
            {Number(donation.amount).toLocaleString("en-IN")} {donation.currency}
          </p>
          {donation.micro_unit_label && (
            <p>
              <span className="text-muted-foreground">Unit: </span>
              {donation.micro_unit_label}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Status: </span>
            {donation.payment_status}
          </p>
          {donation.razorpay_payment_id && (
            <p>
              <span className="text-muted-foreground">Payment ref: </span>
              {donation.razorpay_payment_id}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date(donation.created_at).toLocaleString()}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/projects/${donation.project_id}`}>Back to project</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
