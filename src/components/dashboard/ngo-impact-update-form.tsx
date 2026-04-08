"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createImpactUpdate } from "@/app/actions/ngo"
import { AiCaptionButton } from "@/components/dashboard/ai-caption-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Upload, X } from "lucide-react"

type ProjectOption = { id: string; title: string; is_past_campaign?: boolean | null }

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024
const MAX_FILES_PER_POST = 12

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  if (mime === "image/gif") return "gif"
  if (mime === "video/mp4") return "mp4"
  if (mime === "video/webm") return "webm"
  if (mime === "video/quicktime") return "mov"
  return "jpg"
}

function validateMediaFile(file: File): string | null {
  const okImage = /^image\/(jpeg|png|webp|gif)$/.test(file.type)
  const okVideo = /^video\/(mp4|webm|quicktime)$/.test(file.type)
  if (!okImage && !okVideo) {
    return "Use a JPEG, PNG, WebP, or GIF image, or an MP4, WebM, or MOV video."
  }
  const max = okVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > max) {
    const mb = Math.round(max / (1024 * 1024))
    return okVideo ? `Video must be under ${mb} MB.` : `Image must be under ${mb} MB.`
  }
  return null
}

type Props = { projects: ProjectOption[]; userId: string }

function ProjectSelectOptions({ projects }: { projects: ProjectOption[] }) {
  const past = projects.filter((p) => p.is_past_campaign)
  const current = projects.filter((p) => !p.is_past_campaign)
  return (
    <>
      {current.length > 0 && (
        <optgroup label="Current & upcoming">
          {current.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </optgroup>
      )}
      {past.length > 0 && (
        <optgroup label="Past / historical">
          {past.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </optgroup>
      )}
    </>
  )
}

export function NgoImpactUpdateForm({ projects, userId }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (picked.length === 0) return

    setSelectedFiles((prev) => {
      const next = [...prev]
      for (const file of picked) {
        if (next.length >= MAX_FILES_PER_POST) {
          toast.message(`You can add up to ${MAX_FILES_PER_POST} files per post.`)
          break
        }
        const err = validateMediaFile(file)
        if (err) {
          toast.error(err)
          continue
        }
        next.push(file)
      }
      return next
    })
  }

  function removeFileAt(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function clearFiles() {
    setSelectedFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const projectId = String(formData.get("project_id") ?? "")
      const caption = String(formData.get("caption") ?? "").trim()
      const urlRaw = String(formData.get("media_url") ?? "").trim()
      const urlMediaType = (formData.get("media_type") as string) === "video" ? "video" : "image"

      type Item = { media_url: string; media_type: "image" | "video" }
      let items: Item[] = []

      if (selectedFiles.length > 0) {
        const hasVideo = selectedFiles.some((f) => f.type.startsWith("video/"))
        if (selectedFiles.length > 1 && hasVideo) {
          toast.error("Carousel posts currently support images only. Upload one video at a time.")
          return
        }
        const supabase = createClient()
        try {
          const uploaded = await Promise.all(
            selectedFiles.map(async (file, slot) => {
              const err = validateMediaFile(file)
              if (err) throw new Error(err)
              const ext = extFromMime(file.type)
              const path = `impact-updates/${userId}/${Date.now()}-${slot}-${crypto.randomUUID().slice(0, 8)}.${ext}`
              const { error: upErr } = await supabase.storage.from("project-media").upload(path, file, {
                cacheControl: "3600",
                upsert: false,
              })
              if (upErr) throw new Error(upErr.message)
              const {
                data: { publicUrl },
              } = supabase.storage.from("project-media").getPublicUrl(path)
              const media_type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image"
              return { media_url: publicUrl, media_type }
            })
          )
          items = uploaded
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Upload failed")
          return
        }
      } else if (urlRaw) {
        items = [{ media_url: urlRaw, media_type: urlMediaType }]
      } else {
        toast.error("Add one or more photos/videos from your device, or paste a single link.")
        return
      }

      const fd = new FormData()
      fd.set("project_id", projectId)
      fd.set("caption", caption)
      fd.set("media_items_json", JSON.stringify(items))

      const result = await createImpactUpdate(fd)
      if (result.ok) {
        toast.success("Impact update published", {
          description: "It appears on the public impact feed and your project page.",
        })
        formRef.current?.reset()
        clearFiles()
        router.refresh()
        return
      }
      toast.error("Could not submit", { description: result.error })
    })
  }

  const hasFiles = selectedFiles.length > 0
  const uploadLabel =
    selectedFiles.length > 0
      ? `Add more (${selectedFiles.length}/${MAX_FILES_PER_POST})`
      : "Upload from device"

  return (
    <form ref={formRef} action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ngo_impact_project_id">Project</Label>
        <select
          id="ngo_impact_project_id"
          name="project_id"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Select…</option>
          <ProjectSelectOptions projects={projects} />
        </select>
      </div>

      <div className="space-y-2">
        <Label>Photos &amp; videos</Label>
        <p className="text-xs text-muted-foreground">
          Upload up to {MAX_FILES_PER_POST} files at once to publish one swipeable carousel post, or paste one public
          HTTPS media link below if you are not uploading files.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadLabel}
          </Button>
          {hasFiles && (
            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={clearFiles}>
              Clear all
            </Button>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border bg-muted/30 p-2 text-xs">
            {selectedFiles.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {file.type.startsWith("video/") ? "Video" : "Image"}
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={() => removeFileAt(i)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ngo_impact_media_url">Photo or video URL {hasFiles ? "(optional — ignored while files are selected)" : ""}</Label>
        <Input
          id="ngo_impact_media_url"
          name="media_url"
          required={!hasFiles}
          placeholder="https://…"
          disabled={hasFiles}
          className={hasFiles ? "opacity-60" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ngo_impact_media_type">
          Media type for URL {hasFiles ? "(not used for uploads)" : ""}
        </Label>
        <select
          id="ngo_impact_media_type"
          name="media_type"
          disabled={hasFiles}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-60"
        >
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ngo_impact_context">Context for AI (optional)</Label>
        <Textarea id="ngo_impact_context" rows={2} placeholder="Kids receiving midday meals in Vizag…" />
      </div>
      <AiCaptionButton contextFieldId="ngo_impact_context" targetFieldId="ngo_impact_caption" />
      <div className="space-y-2">
        <Label htmlFor="ngo_impact_caption">Caption</Label>
        <Textarea id="ngo_impact_caption" name="caption" rows={3} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {hasFiles ? "Uploading & publishing…" : "Publishing…"}
            </>
          ) : (
            "Publish update"
          )}
        </Button>
        <Button type="button" variant="link" className="h-auto px-0 text-muted-foreground sm:justify-end" asChild>
          <Link href="/feed">View impact feed</Link>
        </Button>
      </div>
    </form>
  )
}
