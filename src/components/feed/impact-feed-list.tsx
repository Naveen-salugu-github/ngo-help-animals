"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, Share2, MapPin, BadgeCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import type { ImpactFeedRow } from "@/lib/impact-feed-data"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ImpactFeedList({ initial }: { initial: ImpactFeedRow[] }) {
  const [items, setItems] = useState(initial)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.access_token ?? null)
    })
  }, [])

  async function toggleLike(id: string) {
    if (!accessToken) {
      toast.message("Log in to like posts")
      return
    }
    const res = await fetch(`/api/v1/impact/${id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      toast.error("Could not update like")
      return
    }
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, like_count: p.like_count + 1 } : p))
    )
  }

  async function share(id: string) {
    await fetch(`/api/v1/impact/${id}/share`, { method: "POST" })
    const url = `${window.location.origin}/projects/${items.find((i) => i.id === id)?.projects?.id ?? ""}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied")
    } catch {
      toast.message("Share this project from the project page")
    }
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, share_count: p.share_count + 1 } : p))
    )
  }

  if (!items.length) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center text-muted-foreground">
        No impact posts yet. NGOs publish field updates after verification.
      </Card>
    )
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 pb-16">
      {items.map((post) => {
        const ngo = post.projects?.ngos
        const verified = ngo?.verification_status === "verified"
        return (
          <Card key={post.id} className="overflow-hidden border-0 shadow-lg">
            <div className="relative aspect-[4/5] w-full bg-muted sm:aspect-square">
              {post.media_type === "video" ? (
                <video
                  src={post.media_url}
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                />
              ) : (
                <Image
                  src={post.media_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 512px"
                />
              )}
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{ngo?.organization_name ?? "NGO"}</span>
                    {verified && (
                      <BadgeCheck
                        className={cn("h-5 w-5 shrink-0 text-primary")}
                        aria-label="Verified NGO"
                      />
                    )}
                  </div>
                  {post.projects && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/projects/${post.projects.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {post.projects.title}
                      </Link>
                      {post.projects.is_past_campaign ? (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          Past campaign
                        </Badge>
                      ) : null}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{post.caption}</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => toggleLike(post.id)}>
                  <Heart className="mr-1 h-4 w-4" />
                  {post.like_count}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => share(post.id)}>
                  <Share2 className="mr-1 h-4 w-4" />
                  {post.share_count}
                </Button>
                {post.projects && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/projects/${post.projects.id}`}>
                      <MapPin className="mr-1 h-4 w-4" />
                      Project
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
