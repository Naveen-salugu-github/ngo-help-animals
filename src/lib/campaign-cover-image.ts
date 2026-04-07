/** Shared validation + path helpers for campaign cover uploads (project-media bucket). */

export const CAMPAIGN_COVER_MAX_BYTES = 10 * 1024 * 1024

export function extFromImageMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  if (mime === "image/gif") return "gif"
  return "jpg"
}

export function validateCampaignCoverFile(file: File): string | null {
  const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.type)
  if (!ok) {
    return "Use a JPEG, PNG, WebP, or GIF image for the cover."
  }
  if (file.size > CAMPAIGN_COVER_MAX_BYTES) {
    return "Cover image must be under 10 MB."
  }
  return null
}

export function buildCampaignCoverStoragePath(userId: string, file: File): string {
  const ext = extFromImageMime(file.type)
  return `campaign-covers/${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
}
