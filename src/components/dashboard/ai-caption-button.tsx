"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

type Props = {
  contextFieldId: string
  targetFieldId: string
}

export function AiCaptionButton({ contextFieldId, targetFieldId }: Props) {
  const [loading, setLoading] = useState(false)

  async function run() {
    const ctx = (document.getElementById(contextFieldId) as HTMLTextAreaElement | null)?.value
    if (!ctx?.trim()) {
      toast.message("Add a short description of the photo first")
      return
    }
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to use AI")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/v1/ai/caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ context: ctx }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "AI error")
      const target = document.getElementById(targetFieldId) as HTMLTextAreaElement | null
      if (target) target.value = data.caption
      toast.success("Caption generated")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI unavailable")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={run}>
      {loading ? "Generating…" : "AI caption (Groq)"}
    </Button>
  )
}
