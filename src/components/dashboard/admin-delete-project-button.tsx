"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteProjectAsAdmin } from "@/app/actions/admin"
import { toast } from "sonner"

export function AdminDeleteProjectButton({ projectId, title }: { projectId: string; title: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onDelete() {
    if (!confirm(`Delete campaign “${title}” permanently?\n\nDonations, volunteers, impact posts, and sponsorships tied to this project will be removed.`)) {
      return
    }
    startTransition(async () => {
      const result = await deleteProjectAsAdmin(projectId)
      if (result.ok) {
        toast.success("Campaign removed")
        router.refresh()
      } else {
        toast.error(result.error ?? "Could not delete")
      }
    })
  }

  return (
    <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={onDelete}>
      {pending ? "Deleting…" : "Delete"}
    </Button>
  )
}
