"use client"

import { useRef, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createImpactUpdate } from "@/app/actions/ngo"
import { AiCaptionButton } from "@/components/dashboard/ai-caption-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type ProjectOption = { id: string; title: string }

export function HomeImpactUpdateForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createImpactUpdate(formData)
      if (result.ok) {
        toast.success("Impact update published", {
          description: "It appears on the public impact feed and your project page.",
        })
        formRef.current?.reset()
        router.refresh()
        return
      }
      toast.error("Could not submit", { description: result.error })
    })
  }

  return (
    <form ref={formRef} action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="home_impact_project_id">Project</Label>
        <select
          id="home_impact_project_id"
          name="project_id"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Select…</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="home_impact_media_url">Photo or video URL</Label>
        <Input id="home_impact_media_url" name="media_url" required placeholder="https://…" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="home_impact_media_type">Media type</Label>
        <select
          id="home_impact_media_type"
          name="media_type"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="home_impact_context">Context for AI (optional)</Label>
        <Textarea id="home_impact_context" rows={2} placeholder="Kids receiving midday meals in Vizag…" />
      </div>
      <AiCaptionButton contextFieldId="home_impact_context" targetFieldId="home_impact_caption" />
      <div className="space-y-2">
        <Label htmlFor="home_impact_caption">Caption</Label>
        <Textarea id="home_impact_caption" name="caption" rows={3} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit update"}
        </Button>
        <Button type="button" variant="link" className="h-auto px-0 text-muted-foreground sm:justify-end" asChild>
          <Link href="/feed">View impact feed</Link>
        </Button>
      </div>
    </form>
  )
}
