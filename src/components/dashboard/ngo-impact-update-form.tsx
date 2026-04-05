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

type ProjectOption = { id: string; title: string }

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 50 * 1024 * 1024

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

export function NgoImpactUpdateForm({ projects, userId }: Props) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const err = validateMediaFile(file)
    if (err) {
      toast.error(err)
      return
    }
    setSelectedFile(file)
  }

  function clearFile() {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      const projectId = String(formData.get("project_id") ?? "")
      const urlRaw = String(formData.get("media_url") ?? "").trim()
      const caption = String(formData.get("caption") ?? "").trim()
      let mediaType = String(formData.get("media_type") ?? "image")
      let mediaUrl = urlRaw

      if (selectedFile) {
        const err = validateMediaFile(selectedFile)
        if (err) {
          toast.error(err)
          return
        }
        const supabase = createClient()
        const ext = extFromMime(selectedFile.type)
        const path = `impact-updates/${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
        const { error: upErr } = await supabase.storage.from("project-media").upload(path, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        })
        if (upErr) {
          toast.error(upErr.message)
          return
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("project-media").getPublicUrl(path)
        mediaUrl = publicUrl
        mediaType = selectedFile.type.startsWith("video/") ? "video" : "image"
      }

      if (!mediaUrl) {
        toast.error("Add a media URL or upload a file from your device.")
        return
      }

      const fd = new FormData()
      fd.set("project_id", projectId)
      fd.set("media_url", mediaUrl)
      fd.set("media_type", mediaType)
      fd.set("caption", caption)

      const result = await createImpactUpdate(fd)
      if (result.ok) {
        toast.success("Impact update published", {
          description: "It appears on the public impact feed and your project page.",
        })
        formRef.current?.reset()
        clearFile()
        router.refresh()
        return
      }
      toast.error("Could not submit", { description: result.error })
    })
  }

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
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Media</Label>
        <p className="text-xs text-muted-foreground">
          Upload a file (stored in your ImpactBridge media folder) or paste a public HTTPS link to an image or video.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onFileChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload from device
          </Button>
          {selectedFile && (
            <span className="inline-flex max-w-full items-center gap-2 rounded-md border bg-muted/50 px-2 py-1 text-xs">
              <span className="truncate" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                onClick={clearFile}
                aria-label="Remove file"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ngo_impact_media_url">Photo or video URL {selectedFile ? "(optional)" : ""}</Label>
        <Input
          id="ngo_impact_media_url"
          name="media_url"
          required={!selectedFile}
          placeholder="https://…"
          disabled={!!selectedFile}
          className={selectedFile ? "opacity-60" : ""}
        />
        {selectedFile && (
          <p className="text-xs text-muted-foreground">URL is ignored while a file is selected. Remove the file to use a link.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ngo_impact_media_type">Media type {selectedFile ? "(set from file when uploading)" : ""}</Label>
        <select
          id="ngo_impact_media_type"
          name="media_type"
          disabled={!!selectedFile}
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
              {selectedFile ? "Uploading & publishing…" : "Publishing…"}
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
