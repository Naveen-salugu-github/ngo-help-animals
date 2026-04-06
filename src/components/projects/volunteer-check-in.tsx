"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function VolunteerCheckIn({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function checkIn() {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to check in")
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
        body: JSON.stringify({ projectId, status: "checked_in" }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error ?? "Check-in failed")
      }
      toast.success("Checked in. Thank you for showing up.")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Check-in failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" className="w-full" disabled={loading} onClick={checkIn}>
      Check in at event
    </Button>
  )
}
