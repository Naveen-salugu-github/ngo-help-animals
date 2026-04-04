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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Props = {
  projectId: string
  disabled: boolean
  fullMessage?: string
}

export function VolunteerEventRegistration({ projectId, disabled, fullMessage }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to register")
      router.push(`/login?next=/projects/${projectId}`)
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
      const msg =
        body.emailSent === true
          ? "You’re registered. Check your inbox for date, place, and WhatsApp link."
          : body.emailNotSentReason === "resend_rejected"
            ? "You’re registered. Email wasn’t delivered — in Vercel logs look for [email] Resend error; verify RESEND_API_KEY, RESEND_FROM_EMAIL, and your Resend domain."
            : body.emailSent === false
              ? "You’re registered. (Add RESEND_API_KEY for Production in Vercel, redeploy, and avoid quotes around the key.)"
              : "You’re registered."
      toast.success(msg)
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
        {fullMessage ?? "Registration is full — no more spots available."}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          Register for this event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Event registration</DialogTitle>
            <DialogDescription>
              Full name and email are required so we can send your confirmation (date, time, place) and a WhatsApp-friendly
              link. Phone is optional.
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
                placeholder="+91 98765 43210 — optional"
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
  )
}
