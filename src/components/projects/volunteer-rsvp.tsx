"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function VolunteerRsvp({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function rsvp() {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to RSVP")
      router.push(`/login?next=/projects/${projectId}`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/v1/volunteers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ projectId }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error ?? "RSVP failed")
      }
      toast.success("You’re on the list — see you in the field.")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "RSVP failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" className="w-full" disabled={loading} onClick={rsvp}>
      RSVP to volunteer
    </Button>
  )
}
