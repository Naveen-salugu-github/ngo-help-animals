"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Upload, X } from "lucide-react"
import { validateCampaignCoverFile } from "@/lib/campaign-cover-image"

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif"

type Props = {
  /** Default URL for edit forms */
  defaultUrl?: string | null
  disabled?: boolean
  idPrefix?: string
  selectedFile: File | null
  onSelectedFileChange: (file: File | null) => void
}

/**
 * Cover image: paste a URL and/or pick a local file. On form submit, the parent uploads the file
 * (if any) and sets `cover_image_url` on the FormData.
 */
export function CampaignCoverImageField({
  defaultUrl,
  disabled,
  idPrefix = "cover",
  selectedFile,
  onSelectedFileChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      return
    }
    const u = URL.createObjectURL(selectedFile)
    setPreviewUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [selectedFile])

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    const err = validateCampaignCoverFile(f)
    if (err) {
      toast.error(err)
      return
    }
    onSelectedFileChange(f)
  }

  function clearFile() {
    onSelectedFileChange(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const urlId = `${idPrefix}_cover_image_url`
  const fileId = `${idPrefix}_cover_image_file`

  return (
    <div className="sm:col-span-2 space-y-3">
      <Label htmlFor={urlId}>Cover image</Label>
      <p className="text-xs text-muted-foreground">
        Paste an image URL, or upload a file from your device (JPEG, PNG, WebP, or GIF, max 10 MB). If you upload a
        file, it is used instead of the URL when you save.
      </p>
      <Input
        id={urlId}
        name="cover_image_url"
        type="text"
        inputMode="url"
        placeholder="https://…"
        defaultValue={defaultUrl ?? ""}
        disabled={disabled}
        autoComplete="off"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          id={fileId}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={onPick}
        />
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Choose image file
        </Button>
        {selectedFile && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={clearFile}>
            <X className="mr-2 h-4 w-4" />
            Remove file
          </Button>
        )}
        {selectedFile && <span className="text-xs text-muted-foreground">{selectedFile.name}</span>}
      </div>
      {previewUrl && (
        <div className="relative mt-2 h-36 w-full max-w-md overflow-hidden rounded-md border bg-muted">
          <Image src={previewUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      )}
      {!selectedFile && defaultUrl && (
        <div className="relative mt-2 h-36 w-full max-w-md overflow-hidden rounded-md border bg-muted">
          <Image src={defaultUrl} alt="" fill className="object-cover" unoptimized />
        </div>
      )}
    </div>
  )
}
