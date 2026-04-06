"use client"

import { useEffect, useState } from "react"
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
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VOLUNTEER_WHATSAPP_CHANNEL_URL } from "@/lib/community-links"
import { toast } from "sonner"

/** Official Impact Bridge WhatsApp channel (under the register button and for users already on the RSVP list). */
export function VolunteerWhatsappChannelCard() {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm">
      <p className="font-medium text-foreground">Follow Impact Bridge on WhatsApp</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Official channel for event updates and Impact Bridge announcements.
      </p>
      <a
        href={VOLUNTEER_WHATSAPP_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block font-medium text-primary underline underline-offset-4"
      >
        Open WhatsApp channel
      </a>
    </div>
  )
}

type Props = {
  projectId: string
  disabled: boolean
  fullMessage?: string
}

export function VolunteerEventRegistration({ projectId, disabled, fullMessage }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("users")
        .select("name, email")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.name) setName(data.name)
          if (data?.email) setEmail(data.email)
        })
    })
  }, [open])

  async function openRegistrationDialog() {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to register for this event")
      router.push(`/login?next=${encodeURIComponent(`/projects/${projectId}`)}`)
      return
    }
    setOpen(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to register for this event")
      router.push(`/login?next=${encodeURIComponent(`/projects/${projectId}`)}`)
      return
    }
    const nameTrim = name.trim()
    const emailTrim = email.trim()
    const emailOk = emailTrim.length > 3 && emailTrim.includes("@") && emailTrim.includes(".")
    if (!nameTrim) {
      toast.error("Full name is required")
      return
    }
    if (!emailTrim || !emailOk) {
      toast.error("A valid email is required")
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
        body: JSON.stringify({
          projectId,
          phone: phone.trim() || undefined,
          contactEmail: emailTrim,
          participantName: nameTrim,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        throw new Error(body.error ?? "Registration failed")
      }
      setJustRegistered(true)
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  if (disabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        {fullMessage ?? "Registration is full. No more spots available."}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void openRegistrationDialog()}
        >
          Register for this event
        </Button>
        <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Event registration</DialogTitle>
            <DialogDescription>
              Full name and email are required for your registration record. After you confirm, a link to the Impact
              Bridge WhatsApp channel appears below the button on this page. Phone is optional.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full name</Label>
              <Input
                id="reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">Phone (optional)</Label>
              <Input
                id="reg-phone"
                type="tel"
                placeholder="+91 98765 43210 (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              <p className="text-xs text-muted-foreground">Add a number if the organizer should reach you by call or SMS.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting…" : "Confirm registration"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
      {justRegistered && <VolunteerWhatsappChannelCard />}
    </div>
  )
}
