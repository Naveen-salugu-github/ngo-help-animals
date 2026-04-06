"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function DonateSuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const projectId = searchParams.get("project_id")

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [message, setMessage] = useState("")
  const [receiptPath, setReceiptPath] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setStatus("error")
      setMessage("Missing payment session. Return to the project and try again.")
      return
    }

    let cancelled = false
    ;(async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        if (!cancelled) {
          const nextPath = `/donate/success?session_id=${encodeURIComponent(sessionId)}${projectId ? `&project_id=${encodeURIComponent(projectId)}` : ""}`
          router.push(`/login?next=${encodeURIComponent(nextPath)}`)
        }
        return
      }

      const res = await fetch("/api/v1/payments/stripe/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (cancelled) return
      if (!res.ok) {
        setStatus("error")
        setMessage(data.error ?? "Could not confirm payment")
        return
      }
      setStatus("ok")
      setMessage("Thank you. Your impact is on its way.")
      if (typeof data.receiptPath === "string") setReceiptPath(data.receiptPath)
    })()

    return () => {
      cancelled = true
    }
  }, [sessionId, projectId, router])

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      {status === "loading" && <p className="text-muted-foreground">Confirming your payment…</p>}
      {status !== "loading" && (
        <>
          <p className={status === "ok" ? "text-lg font-medium text-primary" : "text-destructive"}>{message}</p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            {receiptPath && (
              <Button asChild variant="default">
                <Link href={receiptPath}>View receipt</Link>
              </Button>
            )}
            {projectId && (
              <Button asChild variant={receiptPath ? "outline" : "default"}>
                <Link href={`/projects/${projectId}`}>Back to project</Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/projects">Explore projects</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
