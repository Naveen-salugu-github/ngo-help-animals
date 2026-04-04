"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Mail } from "lucide-react"

type Props = {
  projectId: string
  projectTitle: string
  ngoName: string
  /** Compact button for grid cards */
  variant?: "default" | "compact"
}

export function ContactOrganizerDialog({
  projectId,
  projectTitle,
  ngoName,
  variant = "default",
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to contact the organizer")
      router.push(`/login?next=/projects/${projectId}`)
      return
    }
    const text = message.trim()
    if (text.length < 5) {
      toast.error("Please write a short message (at least 5 characters)")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/contact-organizer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send")
      }
      toast.success(
        data.emailSent
          ? "Message sent — the organizer was emailed."
          : "Message saved. (Add RESEND_API_KEY for email delivery.)"
      )
      setOpen(false)
      setMessage("")
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "compact" ? (
          <Button type="button" variant="secondary" size="sm" className="w-full">
            <Mail className="mr-1 h-3.5 w-3.5" />
            Contact organizer
          </Button>
        ) : (
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            <Mail className="mr-2 h-4 w-4" />
            Contact organizer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Message {ngoName}</DialogTitle>
            <DialogDescription>
              About: <strong>{projectTitle}</strong>. Your account email will be shared with the organizer so they can
              reply.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="org-msg">Your message</Label>
            <Textarea
              id="org-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Questions about timing, what to bring, accessibility…"
              required
              minLength={5}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
