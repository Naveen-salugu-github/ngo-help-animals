"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, UserMinus } from "lucide-react"

type VolunteerStatus = "rsvp" | "confirmed" | "checked_in" | "cancelled"

type Props = {
  projectId: string
  status: VolunteerStatus
  /** Smaller button for account list rows */
  compact?: boolean
}

export function VolunteerCancelRegistration({ projectId, status, compact }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (status !== "rsvp" && status !== "confirmed") {
    return null
  }

  async function cancel() {
    if (
      !confirm(
        "Cancel your registration for this event? Your spot will be released and you can sign up again later if slots are open."
      )
    ) {
      return
    }
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to manage registration")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/volunteers?projectId=${encodeURIComponent(projectId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Could not cancel registration")
      }
      toast.success("You are no longer registered for this event.")
      router.refresh()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not cancel registration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={compact ? "outline" : "ghost"}
      size={compact ? "sm" : "default"}
      className={compact ? "shrink-0" : "w-full text-muted-foreground hover:text-destructive"}
      disabled={loading}
      onClick={() => void cancel()}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UserMinus className="mr-2 h-4 w-4" />
      )}
      Cancel registration
    </Button>
  )
}
