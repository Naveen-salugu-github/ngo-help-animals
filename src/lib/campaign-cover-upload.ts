import { createClient } from "@/lib/supabase/client"
import { buildCampaignCoverStoragePath, validateCampaignCoverFile } from "@/lib/campaign-cover-image"

/** Upload a campaign cover to `project-media`; call from client only (authenticated). */
export async function uploadCampaignCoverImage(
  userId: string,
  file: File
): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> {
  const err = validateCampaignCoverFile(file)
  if (err) return { ok: false, error: err }

  const supabase = createClient()
  const path = buildCampaignCoverStoragePath(userId, file)
  const { error: upErr } = await supabase.storage.from("project-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  })
  if (upErr) {
    const msg = upErr.message || "Upload failed"
    if (/row-level security|violates.*policy/i.test(msg)) {
      return {
        ok: false,
        error:
          "Cover image upload was blocked by storage rules. Apply the Supabase migration `20260408000000_project_media_campaign_covers_rls.sql`, or submit without a cover for now.",
      }
    }
    return { ok: false, error: msg }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("project-media").getPublicUrl(path)
  return { ok: true, publicUrl }
}
