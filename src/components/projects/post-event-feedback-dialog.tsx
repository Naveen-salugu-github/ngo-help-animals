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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Star } from "lucide-react"

type Props = {
  projectId: string
  projectTitle: string
  initialRating?: number | null
  initialComment?: string | null
  variant?: "default" | "compact"
}

export function PostEventFeedbackDialog({
  projectId,
  projectTitle,
  initialRating,
  initialComment,
  variant = "default",
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState<number | null>(initialRating ?? null)
  const [comment, setComment] = useState(initialComment ?? "")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRating(initialRating ?? null)
    setComment(initialComment ?? "")
  }, [initialRating, initialComment])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.message("Log in to leave feedback")
      router.push(`/login?next=/projects/${projectId}`)
      return
    }
    const text = comment.trim()
    if (text.length < 10) {
      toast.error("Please write at least a short sentence (10+ characters)")
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          comment: text,
          rating: rating ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save feedback")
      }
      toast.success("Thanks — your feedback was saved.")
      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "compact" ? (
          <Button type="button" variant="outline" size="sm" className="w-full">
            <Star className="mr-1 h-3.5 w-3.5" />
            Rate experience
          </Button>
        ) : (
          <Button type="button" variant="default" className="w-full sm:w-auto">
            <Star className="mr-2 h-4 w-4" />
            {initialComment ? "Update feedback" : "Share feedback"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>How was {projectTitle}?</DialogTitle>
            <DialogDescription>
              Your feedback helps NGOs improve future events. Optional star rating; please write at least one sentence.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="mb-2 block">Rating (optional)</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n === rating ? null : n)}
                    className="rounded p-1 text-amber-500 hover:bg-amber-500/10"
                    aria-label={`${n} stars`}
                  >
                    <Star className={`h-8 w-8 ${rating && n <= rating ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fb-comment">Your experience</Label>
              <Textarea
                id="fb-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="What went well? What could be better?"
                required
                minLength={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Submit feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
