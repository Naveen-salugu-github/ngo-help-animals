"use client"

import { useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { updateAvatarUrl } from "@/app/actions/account"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

type Props = {
  userId: string
}

export function AvatarUpload({ userId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Choose an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2 MB")
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg"
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      })
      if (upErr) {
        toast.error(upErr.message)
        return
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path)
      const res = await updateAvatarUrl(publicUrl)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success("Profile photo updated")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Upload photo
      </Button>
    </>
  )
}
