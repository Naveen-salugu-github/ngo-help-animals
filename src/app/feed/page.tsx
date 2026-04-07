import { createClient } from "@/lib/supabase/server"
import { fetchImpactFeedRows } from "@/lib/impact-feed-data"
import { ImpactFeedList } from "@/components/feed/impact-feed-list"

export const metadata = {
  title: "Impact feed | Soul Space",
  description: "Field photos and videos from verified impact projects.",
}

export default async function FeedPage() {
  const supabase = await createClient()
  const rows = await fetchImpactFeedRows(supabase)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Impact feed</h1>
        <p className="mt-2 text-muted-foreground">
          Field photos and stories from campaigns: meals served, trees planted, shores cleaned, and more.
        </p>
      </div>
      <ImpactFeedList initial={rows} />
    </div>
  )
}
