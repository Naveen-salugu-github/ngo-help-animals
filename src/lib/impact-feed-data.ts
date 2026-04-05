import type { SupabaseClient } from "@supabase/supabase-js"

const IMPACT_FEED_SELECT = `
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

export type ImpactFeedRow = {
  id: string
  media_url: string
  media_type: string
  caption: string
  like_count: number
  share_count: number
  created_at: string
  projects: {
    id: string
    title: string
    ngos: {
      organization_name: string
      verification_status: string
    }
  } | null
}

type RawRow = {
  id: string
  media_url: string
  media_type: string
  caption: string
  like_count: number
  share_count: number
  created_at: string
  projects: unknown
}

export function normalizeImpactFeedRows(rows: RawRow[]): ImpactFeedRow[] {
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
      id: row.id,
      media_url: row.media_url,
      media_type: row.media_type,
      caption: row.caption,
      like_count: row.like_count,
      share_count: row.share_count,
      created_at: row.created_at,
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

export async function fetchImpactFeedRows(supabase: SupabaseClient): Promise<ImpactFeedRow[]> {
  const { data, error } = await supabase
    .from("impact_updates")
    .select(IMPACT_FEED_SELECT)
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("fetchImpactFeedRows:", error)
  }

  return normalizeImpactFeedRows((data ?? []) as RawRow[])
}
