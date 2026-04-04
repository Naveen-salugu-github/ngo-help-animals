"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateProfileName } from "@/app/actions/account"
import { toast } from "sonner"

type Props = {
  initialName: string
  email: string
  role: string
}

export function AccountNameForm({ initialName, email, role }: Props) {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData()
    fd.set("name", name.trim())
    const r = await updateProfileName(fd)
    setLoading(false)
    if ("error" in r && r.error) {
      toast.error(r.error)
      return
    }
    toast.success("Profile saved")
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email-ro">Email</Label>
        <Input id="email-ro" value={email} readOnly className="bg-muted" />
        <p className="text-xs text-muted-foreground">Email is managed by your login provider.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Role</span>
        <Badge variant="secondary">{role}</Badge>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save profile"}
      </Button>
    </form>
  )
}
