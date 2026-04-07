import { Suspense } from "react"
import { DonateSuccessClient } from "./donate-success-client"

export const metadata = {
  title: "Donation complete | Soul Space",
}

export default function DonateSuccessPage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground">Loading…</p>}
    >
      <DonateSuccessClient />
    </Suspense>
  )
}
