import { createClient } from "@/lib/supabase/server"
import { ImpactFeedList } from "@/components/feed/impact-feed-list"

function normalizeFeedRows(
  rows: {
    id: string
    media_url: string
    media_type: string
    caption: string
    like_count: number
    share_count: number
    created_at: string
    projects: unknown
  }[]
) {
  return rows.map((row) => {
    const p = row.projects
    const project = (Array.isArray(p) ? p[0] : p) as
      | {
          id: string
          title: string
          ngos: unknown
        }
      | null
      | undefined
    const n = project?.ngos
    const ngo = (Array.isArray(n) ? n[0] : n) as {
      organization_name: string
      verification_status: string
    } | null
    return {
      ...row,
      projects: project
        ? {
            id: project.id,
            title: project.title,
            ngos: ngo ?? { organization_name: "", verification_status: "" },
          }
        : null,
    }
  })
}

export const metadata = {
  title: "Impact feed | ImpactBridge",
  description: "Field photos and videos from verified impact projects.",
}

export default async function FeedPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("impact_updates")
    .select(
      `
      id,
      media_url,
      media_type,
      caption,
      like_count,
      share_count,
      created_at,
      projects:project_id (
        id,
        title,
        ngos:ngo_id (
          organization_name,
          verification_status
        )
      )
    `
    )
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Impact feed</h1>
        <p className="mt-2 text-muted-foreground">
          Real updates from the ground — meals served, trees planted, shores cleaned.
        </p>
      </div>
      <ImpactFeedList initial={normalizeFeedRows(data ?? [])} />
    </div>
  )
}
